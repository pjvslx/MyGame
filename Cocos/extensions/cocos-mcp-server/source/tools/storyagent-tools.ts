/**
 * StoryAgent 关卡导入工具
 * - storyagent_connect: 配置服务器地址 + 账号密码，登录拿 token（Cookie: storyagent_token）
 * - storyagent_list_projects: 列出 StoryAgent 项目
 * - storyagent_import_project: 拉取项目全部关卡（scene.json → puzzleGraph + nodeMap）与资产
 *
 * 依赖 StoryAgent HTTP API（无需改服务端）：
 *   POST /api/auth/login                     {username,password} → {token,user}
 *   GET  /api/projects                       项目列表
 *   GET  /api/novels/[id]/assets?folder=X    资产列表 {assets, subFolders}
 *   GET  /api/novels/[id]/assets/[assetId]   资产文件内容
 */

import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ToolDefinition, ToolResponse, ToolExecutor, StoryAgentSettings } from '../types';
import { readSettings, saveSettings, DEFAULT_STORY_AGENT_SETTINGS } from '../settings';

const COOKIE_NAME = 'storyagent_token';

// ────────────────────────────────────────────────────────────
// 类型（与 StoryAgent 序列化格式对齐）
// ────────────────────────────────────────────────────────────

interface StoryAgentSceneNode {
    id: string;
    name: string;
    nodeType?: string;
    parentId?: string | null;
    children?: StoryAgentSceneNode[];
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    contentSize?: { width: number; height: number };
    tintColor?: string;
    spriteFrame?: string;
    spineSkeleton?: string;
    spineAtlas?: string;
    spineAnimation?: string;
    spineSkin?: string;
    spineLoop?: boolean;
    spineTimeScale?: number;
    spinePlaying?: boolean;
    spinePremultipliedAlpha?: boolean;
    labelText?: string;
    fontSize?: number;
    fontColor?: string;
    visible?: boolean;
    meshType?: string;
    components?: Array<{ type: string; label?: string; props?: Record<string, any> }>;
    animationClips?: StoryAgentAnimationClip[];
    [key: string]: any;
}

interface StoryAgentAnimationClip {
    id: string;
    name: string;
    duration: number;
    fps: number;
    wrapMode: 'once' | 'loop' | 'pingPong';
    speed?: number;
    tracks: StoryAgentAnimationTrack[];
}

interface StoryAgentAnimationTrack {
    id: string;
    targetNodeId: string;
    property: string;
    keyframes: StoryAgentKeyframe[];
}

interface StoryAgentKeyframe {
    time: number;
    value: number | boolean;
    interpolation: string;
    bezierLeft?: [number, number];
    bezierRight?: [number, number];
}

interface StoryAgentSerializedScene {
    metadata?: { type?: string; version?: number };
    scene?: { nodes?: StoryAgentSceneNode[] };
    backgroundTexture?: string | null;
    environmentTexture?: string | null;
    puzzleGraph?: Record<string, any>;
}

interface StoryAgentAssetMeta {
    id: string;
    fileName: string;
    folderPath: string;
    mimeType: string;
    fileSize: number;
}

interface StoryAgentProject {
    id: string;
    title: string;
    projectType?: string;
    updatedAt?: string;
}

interface ImportedAssetInfo {
    id: string;
    fileName: string;
    folderPath: string;
    dbUrl: string;
    uuid?: string;
    spriteFrameUuid?: string;
}

type CocosJsonItem = Record<string, any>;

// ────────────────────────────────────────────────────────────
// HTTP 客户端
// ────────────────────────────────────────────────────────────

interface FetchResult {
    status: number;
    headers: http.IncomingHttpHeaders;
    body: Buffer;
}

function httpRequest(urlStr: string, options: { method?: string; body?: any; cookie?: string; timeoutMs?: number } = {}): Promise<FetchResult> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(urlStr);
        const lib = parsed.protocol === 'https:' ? https : http;
        const payload = options.body !== undefined ? Buffer.from(typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

        const req = lib.request(parsed, {
            method: options.method ?? (payload ? 'POST' : 'GET'),
            headers: {
                ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': String(payload.length) } : {}),
                ...(options.cookie ? { Cookie: options.cookie } : {}),
            },
            timeout: options.timeoutMs ?? 15000,
        }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
        });

        req.on('error', (err) => reject(new Error(`网络错误：${err.message}`)));
        req.on('timeout', () => { req.destroy(new Error('请求超时')); });
        if (payload) req.write(payload);
        req.end();
    });
}

// ────────────────────────────────────────────────────────────
// 配置读写
// ────────────────────────────────────────────────────────────

function getStoryAgentSettings(): StoryAgentSettings {
    const settings = readSettings();
    return { ...DEFAULT_STORY_AGENT_SETTINGS, ...(settings.storyAgent ?? {}) };
}

function saveStoryAgentSettings(patch: Partial<StoryAgentSettings>): StoryAgentSettings {
    const settings = readSettings();
    const next: StoryAgentSettings = { ...getStoryAgentSettings(), ...patch };
    settings.storyAgent = next;
    saveSettings(settings);
    return next;
}

function buildUrl(baseUrl: string, apiPath: string): string {
    return `${baseUrl.replace(/\/+$/, '')}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
}

/** 已登录才可用的请求封装；401 抛"登录过期" */
async function authedFetch(baseUrl: string, token: string, apiPath: string, options: { method?: string; body?: any } = {}): Promise<FetchResult> {
    if (!token) throw new Error('未登录 StoryAgent，请先调用 storyagent_connect');
    const res = await httpRequest(buildUrl(baseUrl, apiPath), {
        method: options.method,
        body: options.body,
        cookie: `${COOKIE_NAME}=${token}`,
    });
    if (res.status === 401) throw new Error('登录已过期，请重新调用 storyagent_connect');
    if (res.status >= 400) {
        const detail = res.body.length ? res.body.toString('utf8').slice(0, 300) : '';
        throw new Error(`StoryAgent 请求失败 (${res.status})：${detail}`);
    }
    return res;
}

function parseJson<T>(res: FetchResult): T {
    return JSON.parse(res.body.toString('utf8'));
}

// ────────────────────────────────────────────────────────────
// 工具类
// ────────────────────────────────────────────────────────────

export class StoryAgentTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'connect',
                description: '配置 StoryAgent 服务器地址与账号密码并登录，成功后缓存 token',
                inputSchema: {
                    type: 'object',
                    properties: {
                        baseUrl: { type: 'string', description: 'StoryAgent 服务器地址（如 http://127.0.0.1:3000），不传则用已保存配置' },
                        username: { type: 'string', description: '账号，不传则用已保存配置' },
                        password: { type: 'string', description: '密码，不传则用已保存配置' }
                    }
                }
            },
            {
                name: 'list_projects',
                description: '列出 StoryAgent 中可导入的项目',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'import_project',
                description: '导入指定项目的全部关卡（scene.json → puzzles bundle + 独立 Cocos .scene）与资源资产到 Cocos 工程',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectId: { type: 'string', description: 'StoryAgent 项目 ID' },
                        includeAssets: { type: 'boolean', description: '同时下载贴图/Spine/音频等资产', default: true },
                        importScenes: { type: 'boolean', description: '同时生成独立 Cocos .scene 场景资源', default: true },
                        overwrite: { type: 'boolean', description: '覆盖已存在文件', default: true }
                    },
                    required: ['projectId']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'connect':
                return await this.connect(args);
            case 'list_projects':
                return await this.listProjects();
            case 'import_project':
                return await this.importProject(args);
            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    }

    // ── connect ──

    private async connect(args: any): Promise<ToolResponse> {
        try {
            const current = getStoryAgentSettings();
            const baseUrl = (args.baseUrl || current.baseUrl || '').trim();
            const username = (args.username || current.username || '').trim();
            const password = args.password || current.password;

            if (!baseUrl) return { success: false, error: '缺少 baseUrl（StoryAgent 服务器地址）' };
            if (!username || !password) return { success: false, error: '缺少 username / password' };

            const res = await httpRequest(buildUrl(baseUrl, '/api/auth/login'), {
                method: 'POST',
                body: { username, password },
            });

            if (res.status === 401) {
                return { success: false, error: '登录失败：账号或密码错误（401）' };
            }
            if (res.status >= 400) {
                return { success: false, error: `登录失败 (${res.status})：${res.body.toString('utf8').slice(0, 300)}` };
            }

            const data = parseJson<{ token: string; user?: any }>(res);
            if (!data.token) return { success: false, error: '登录响应缺少 token' };

            const saved = saveStoryAgentSettings({
                baseUrl,
                username,
                password,
                token: data.token,
                tokenExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 服务端 7 天有效
            });

            return {
                success: true,
                message: `已连接到 StoryAgent（${baseUrl}），用户：${data.user?.username ?? data.user?.name ?? username}`,
                data: { user: data.user, baseUrl: saved.baseUrl, tokenExpiresAt: saved.tokenExpiresAt },
            };
        } catch (err: any) {
            return { success: false, error: `连接失败：${err.message}` };
        }
    }

    // ── list_projects ──

    private async listProjects(): Promise<ToolResponse> {
        try {
            const cfg = getStoryAgentSettings();
            const res = await authedFetch(cfg.baseUrl, cfg.token, '/api/projects');
            const data = parseJson<{ projects?: StoryAgentProject[] }>(res);
            const projects = (data.projects ?? []).map((p) => ({
                id: p.id,
                title: p.title,
                projectType: p.projectType ?? 'unknown',
                updatedAt: p.updatedAt ?? null,
            }));
            return { success: true, data: { baseUrl: cfg.baseUrl, projects }, message: `共 ${projects.length} 个项目` };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    // ── import_project ──

    private async importProject(args: any): Promise<ToolResponse> {
        const projectId = String(args.projectId || '').trim();
        if (!projectId) return { success: false, error: '缺少 projectId' };
        const includeAssets = args.includeAssets !== false;
        const importScenes = args.importScenes !== false && args.importSceneNodes !== false;
        const overwrite = args.overwrite !== false;

        try {
            const cfg = getStoryAgentSettings();
            const baseUrl = cfg.baseUrl;
            const token = cfg.token;

            // 1. 拉全量资产元数据（根目录 + 递归子目录）
            const assetMetaMap = await this.fetchAllAssetMetas(baseUrl, token, projectId);
            const sceneAssets = [...assetMetaMap.values()]
                .filter((a) => a.fileName.endsWith('.scene.json'))
                .sort((a, b) => a.fileName.localeCompare(b.fileName));

            if (sceneAssets.length === 0) {
                return { success: false, error: `项目 ${projectId} 中没有找到 *.scene.json 关卡文件`, data: { assetCount: assetMetaMap.size } };
            }

            // 2. 逐个导入关卡
            const sceneQueue: Array<{ sceneAsset: StoryAgentAssetMeta; sceneJson: StoryAgentSerializedScene; sceneName: string; nodeMap: Record<string, { path: string; name: string }> }> = [];
            const importedScenes: any[] = [];
            const skipped: string[] = [];
            const assetRefIds = new Set<string>();

            for (const sceneAsset of sceneAssets) {
                try {
                    const fileRes = await authedFetch(baseUrl, token, `/api/novels/${projectId}/assets/${sceneAsset.id}`);
                    const sceneJson = parseJson<StoryAgentSerializedScene>(fileRes);

                    if (sceneJson.metadata?.type !== 'StoryAgent-Scene' || !Array.isArray(sceneJson.scene?.nodes)) {
                        skipped.push(`${sceneAsset.fileName}（不是有效 StoryAgent 场景）`);
                        continue;
                    }

                    const puzzleGraph = sceneJson.puzzleGraph;
                    const sceneName = sceneAsset.fileName.replace(/\.scene\.json$/i, '');
                    const nodeMap = this.buildNodeMap(sceneJson.scene.nodes ?? [], sceneName);

                    // 收集资产引用
                    if (includeAssets) {
                        this.collectAssetRefs(sceneJson, nodeMap, assetRefIds);
                    }
                    sceneQueue.push({ sceneAsset, sceneJson, sceneName, nodeMap });

                    if (puzzleGraph && Array.isArray(puzzleGraph.nodes)) {
                        const bundle = { script: puzzleGraph, nodeMap };
                        const target = this.resolveStoryAgentAssetTarget(sceneAsset);
                        if (overwrite || !fs.existsSync(target.absFile)) {
                            fs.mkdirSync(path.dirname(target.absFile), { recursive: true });
                            fs.writeFileSync(target.absFile, JSON.stringify(bundle, null, 2), 'utf8');
                        }
                        importedScenes.push({
                            sceneName,
                            fileName: sceneAsset.fileName,
                            dbUrl: target.dbUrl,
                            graphNodes: puzzleGraph.nodes.length,
                            graphConnections: Array.isArray(puzzleGraph.connections) ? puzzleGraph.connections.length : 0,
                            nodeMapCount: Object.keys(nodeMap).length,
                        });
                    } else {
                        skipped.push(`${sceneAsset.fileName}（无 puzzleGraph，仅记录节点映射到 nodeMap）`);
                        if (Object.keys(nodeMap).length > 0) {
                            const bundle = { script: null, nodeMap };
                            const target = this.resolveStoryAgentAssetTarget(sceneAsset);
                            fs.mkdirSync(path.dirname(target.absFile), { recursive: true });
                            fs.writeFileSync(target.absFile, JSON.stringify(bundle, null, 2), 'utf8');
                            importedScenes.push({ sceneName, fileName: sceneAsset.fileName, dbUrl: target.dbUrl, graphNodes: 0, graphConnections: 0, nodeMapCount: Object.keys(nodeMap).length });
                        }
                    }
                } catch (err: any) {
                    skipped.push(`${sceneAsset.fileName}（${err.message}）`);
                }
            }

            // 3. 下载资产
            const importedAssets: ImportedAssetInfo[] = [];
            const assetsToRefresh = new Set<string>(importedScenes.map((scene) => path.posix.dirname(scene.dbUrl)));
            if (includeAssets && assetRefIds.size > 0) {
                // 用队列而非 for-of：下载 .atlas 时会解析出纹理页并追加到队列尾部
                const downloadQueue = [...assetRefIds];
                const downloadedIds = new Set<string>();
                // Spine atlas 引用的纹理页：不写自定义 meta，交给 Creator 自动导入（spine-data importer 按同目录同名匹配）
                const spineTextureIds = new Set<string>();
                let cursor = 0;
                while (cursor < downloadQueue.length) {
                    const assetId = downloadQueue[cursor];
                    cursor += 1;
                    if (downloadedIds.has(assetId)) continue;
                    downloadedIds.add(assetId);
                    const meta = assetMetaMap.get(assetId);
                    if (!meta) continue;
                    try {
                        const binRes = await authedFetch(baseUrl, token, `/api/novels/${projectId}/assets/${assetId}`);
                        const target = this.resolveStoryAgentAssetTarget(meta);
                        // atlas 引用的纹理页是它的同目录兄弟资产，解析后追加下载（即使 atlas 本体已存在也要补齐纹理）
                        if (/\.atlas$/i.test(meta.fileName)) {
                            for (const pageName of this.parseSpineAtlasPages(binRes.body)) {
                                const pageMeta = [...assetMetaMap.values()].find((a) => a.fileName === pageName && a.folderPath === meta.folderPath);
                                if (pageMeta && !downloadedIds.has(pageMeta.id)) {
                                    spineTextureIds.add(pageMeta.id);
                                    downloadQueue.push(pageMeta.id);
                                }
                            }
                        }
                        if (!overwrite && fs.existsSync(target.absFile)) continue;
                        fs.mkdirSync(path.dirname(target.absFile), { recursive: true });
                        fs.writeFileSync(target.absFile, binRes.body);
                        const isImage = this.isImageAsset(meta.fileName);
                        const uuid = isImage && !spineTextureIds.has(assetId) ? this.generateAssetUuid(`storyagent:${projectId}:${assetId}`) : undefined;
                        const spriteFrameUuid = uuid ? `${uuid}@f9941` : undefined;
                        if (isImage && uuid) {
                            this.writeImageMeta(target.absFile, uuid, meta.fileName);
                        }
                        importedAssets.push({ id: assetId, fileName: meta.fileName, folderPath: target.folderPath || '/', dbUrl: target.dbUrl, uuid, spriteFrameUuid });
                        assetsToRefresh.add(path.posix.dirname(target.dbUrl));
                    } catch (err: any) {
                        skipped.push(`${meta.fileName}（资产下载失败：${err.message}）`);
                    }
                }
            }

            // 4. 刷新资源库
            for (const folderUrl of assetsToRefresh) {
                await Editor.Message.request('asset-db', 'refresh-asset', folderUrl).catch(() => undefined);
            }
            // 等待异步导入完成（Cocos asset-db 的 refresh 是异步的，后续 query-asset-info 需要 uuid）
            await this.delay(800);

            const importedAssetMap = await this.resolveImportedAssetInfos(importedAssets);
            const createdScenes: any[] = [];
            if (importScenes) {
                for (const item of sceneQueue) {
                    try {
                        const result = await this.createCocosSceneAsset(item.sceneAsset, item.sceneName, item.sceneJson.scene?.nodes ?? [], importedAssetMap, overwrite);
                        createdScenes.push(result);
                        const target = importedScenes.find((s) => s.sceneName === item.sceneName);
                        if (target) {
                            target.cocosSceneUrl = result.url;
                            target.createdNodeCount = result.nodeCount;
                        }
                    } catch (err: any) {
                        skipped.push(`${item.sceneAsset.fileName}（Cocos 场景生成失败：${err.message}）`);
                    }
                }
            }

            // 5. Spine 版本兼容性检查：引擎 spine-3.8 运行时无法解析 4.x 二进制，
            //    会在场景反序列化时报 "memory access out of bounds" 并使 sp.Skeleton 降级为 MissingScript
            const spine42Assets: string[] = [];
            if (!this.isSpine42FeatureEnabled()) {
                for (const asset of importedAssets) {
                    if (!/\.(skel|json)$/i.test(asset.fileName)) continue;
                    const parts = (asset.folderPath || '').split('/').filter(Boolean);
                    const absFile = path.join(Editor.Project.path, 'assets', ...parts, asset.fileName);
                    const version = this.detectSpineVersion(absFile);
                    if (version && /^4\./.test(version)) spine42Assets.push(`${asset.fileName} (Spine ${version})`);
                }
            }

            let message = `导入完成：${importedScenes.length} 个关卡，${importedAssets.length} 个资产，${createdScenes.length} 个 Cocos 场景`;
            if (spine42Assets.length > 0) {
                message += `；警告：${spine42Assets.join('、')} 为 Spine 4.x 资产，而当前项目引擎特性为 Spine 3.8，请在「项目设置 → 功能裁剪」中切换为 Spine 4.2（否则 spine 节点会报 memory access out of bounds 并显示 MissingScript）`;
            }

            return {
                success: true,
                message,
                data: { projectId, baseUrl, importedScenes, importedAssets, createdScenes, skipped, assetCount: assetMetaMap.size },
            };
        } catch (err: any) {
            return { success: false, error: `导入失败：${err.message}` };
        }
    }

    // ── 辅助 ──

    /** 递归拉取项目全部资产元数据 */
    private async fetchAllAssetMetas(baseUrl: string, token: string, projectId: string): Promise<Map<string, StoryAgentAssetMeta>> {
        const map = new Map<string, StoryAgentAssetMeta>();
        const visited = new Set<string>();
        const queue: string[] = [''];

        while (queue.length > 0) {
            const folder = queue.shift()!;
            const key = folder;
            if (visited.has(key)) continue;
            visited.add(key);

            const query = folder ? `?folder=${encodeURIComponent(folder)}` : '';
            const res = await authedFetch(baseUrl, token, `/api/novels/${projectId}/assets${query}`);
            const data = parseJson<{ assets?: StoryAgentAssetMeta[]; subFolders?: string[] }>(res);

            for (const asset of data.assets ?? []) {
                if (asset.id && asset.fileName) map.set(asset.id, asset);
            }
            for (const sub of data.subFolders ?? []) {
                if (!visited.has(sub)) queue.push(sub);
            }
        }
        return map;
    }

    /** 从 scene 节点树生成 nodeMap：{editorNodeId: {path, name}} */
    private buildNodeMap(nodes: StoryAgentSceneNode[], sceneName: string): Record<string, { path: string; name: string }> {
        const map: Record<string, { path: string; name: string }> = {};
        const walk = (list: StoryAgentSceneNode[], prefix: string) => {
            for (const node of list) {
                if (!node || typeof node.id !== 'string') continue;
                // 场景根节点不作为真实节点，跳过但递归子节点
                if (node.nodeType === 'scene') {
                    if (Array.isArray(node.children)) walk(node.children, prefix);
                    continue;
                }
                const name = node.name || node.id;
                const p = prefix ? `${prefix}/${name}` : name;
                map[node.id] = { path: p, name };
                if (Array.isArray(node.children)) walk(node.children, p);
            }
        };
        walk(nodes, '');
        return map;
    }

    /** 收集 scene 中引用的资产 ID（贴图/Spine/背景等） */
    private collectAssetRefs(sceneJson: StoryAgentSerializedScene, nodeMap: Record<string, { path: string; name: string }>, out: Set<string>): void {
        const pushRef = (value: unknown) => {
            if (typeof value !== 'string' || !value) return;
            const id = value.replace(/^asset:/, '');
            if (id && !/^node:|^component:|^script:/.test(id)) out.add(id);
        };

        // 场景级背景/环境贴图
        pushRef(sceneJson.backgroundTexture);
        pushRef(sceneJson.environmentTexture);

        // 节点级资产字段
        const visit = (node: StoryAgentSceneNode) => {
            pushRef(node.spriteFrame);
            pushRef(node.spineSkeleton);
            pushRef(node.spineAtlas);
            if (Array.isArray(node.children)) node.children.forEach(visit);
        };
        visit({ children: sceneJson.scene?.nodes ?? [] } as StoryAgentSceneNode);

        // puzzleGraph 节点中的 asset: 引用与 audio
        const graph = sceneJson.puzzleGraph;
        if (graph && Array.isArray(graph.nodes)) {
            for (const n of graph.nodes) {
                if (!n || typeof n !== 'object') continue;
                pushRef(n.audio);
                const params = (n as any).params;
                if (params && typeof params === 'object') {
                    for (const v of Object.values(params)) {
                        if (typeof v === 'string' && v.startsWith('asset:')) pushRef(v);
                    }
                }
            }
        }
    }

    private resolveStoryAgentAssetTarget(meta: Pick<StoryAgentAssetMeta, 'fileName' | 'folderPath'>): { folderPath: string; dbUrl: string; absFile: string } {
        const folderPath = this.sanitizeFolder(meta.folderPath || '');
        const parts = folderPath ? folderPath.split('/').filter(Boolean) : [];
        const absFile = path.join(Editor.Project.path, 'assets', ...parts, meta.fileName);
        const dbUrl = `db://assets/${[...parts, meta.fileName].join('/')}`;
        return { folderPath, dbUrl, absFile };
    }

    private async resolveImportedAssetInfos(importedAssets: ImportedAssetInfo[]): Promise<Map<string, ImportedAssetInfo>> {
        const map = new Map<string, ImportedAssetInfo>();
        for (const asset of importedAssets) {
            const resolved = await this.queryAssetUuidWithRetry(asset);
            map.set(asset.id, resolved);
        }
        return map;
    }

    private async queryAssetUuidWithRetry(asset: ImportedAssetInfo): Promise<ImportedAssetInfo> {
        // 图片在下载时已生成 .meta + uuid，直接使用
        if (asset.uuid) return asset;

        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', asset.dbUrl);
                const uuid = assetInfo?.uuid;
                if (uuid) return { ...asset, uuid };
            } catch {
                // query-asset-info 可能抛出异常（资源尚未就绪）
            }
            if (attempt < 4) await this.delay(400);
        }
        // 全部重试失败，尝试最后一次不带 catch
        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', asset.dbUrl);
            const uuid = assetInfo?.uuid;
            return { ...asset, uuid };
        } catch {
            return asset;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private generateAssetUuid(seed: string): string {
        const hex = crypto.createHash('md5').update(seed).digest('hex');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }

    private writeImageMeta(imagePath: string, uuid: string, fileName: string): void {
        const textureUuid = `${uuid}@6c48a`;
        const spriteFrameUuid = `${uuid}@f9941`;
        const meta = {
            ver: '2.0.5',
            importer: 'image',
            imported: true,
            uuid,
            files: ['.json', `.${path.extname(fileName)}`],
            subMetas: {
                '6c48a': {
                    importer: 'texture',
                    uuid: textureUuid,
                    id: '6c48a',
                    name: 'texture',
                    userData: { wrapModeS: 'repeat', wrapModeT: 'repeat', minfilter: 'linear', magfilter: 'linear', mipfilter: 'none', aniso: 0, mipmapCount: 0, isUuid: true },
                    ver: '1.0.22',
                },
                f9941: {
                    importer: 'sprite-frame',
                    uuid: spriteFrameUuid,
                    id: 'f9941',
                    name: 'spriteFrame',
                    userData: { packable: false, pixelsToUnit: 100, pivotX: 0.5, pivotY: 0.5, borderTop: 0, borderBottom: 0, borderLeft: 0, borderRight: 0, meshType: 0, imageUuidOrDatabaseUri: textureUuid, trimType: 'auto', trimThreshold: 1, rotated: false, offsetX: 0, offsetY: 0, trimX: 0, trimY: 0, width: 0, height: 0, rawWidth: 0, rawHeight: 0 },
                    ver: '1.0.14',
                },
            },
            userData: {
                type: 'sprite-frame',
                hasAlpha: true,
            },
        };
        fs.writeFileSync(`${imagePath}.meta`, JSON.stringify(meta, null, 2), 'utf8');
    }

    private async createCocosSceneAsset(sceneAsset: StoryAgentAssetMeta, sceneName: string, nodes: StoryAgentSceneNode[], assetMap: Map<string, ImportedAssetInfo>, overwrite: boolean): Promise<any> {
        const sceneTarget = this.resolveStoryAgentAssetTarget({ ...sceneAsset, fileName: `${sceneName}.scene` });
        if (!overwrite && fs.existsSync(sceneTarget.absFile)) {
            return { sceneName, url: sceneTarget.dbUrl, skipped: true, nodeCount: this.countStoryNodes(nodes) };
        }

        const builder = new CocosSceneBuilder(sceneName, assetMap);
        const sceneItems = builder.build(nodes);
        fs.mkdirSync(path.dirname(sceneTarget.absFile), { recursive: true });
        fs.writeFileSync(sceneTarget.absFile, JSON.stringify(sceneItems, null, 2), 'utf8');
        const animationAssets = builder.getAnimationAssets();
        if (animationAssets.length > 0) {
            for (const asset of animationAssets) {
                const { dir, url } = this.resolveAnimationAssetDir(asset.name, asset.uuid);
                const file = path.join(dir, `${asset.name}.anim`);
                fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(file, JSON.stringify(asset.items, null, 2), 'utf8');
                fs.writeFileSync(`${file}.meta`, JSON.stringify(asset.meta, null, 2), 'utf8');
                await Editor.Message.request('asset-db', 'refresh-asset', url).catch(() => undefined);
            }
        }
        await Editor.Message.request('asset-db', 'refresh-asset', path.posix.dirname(sceneTarget.dbUrl)).catch(() => undefined);
        return { sceneName, url: sceneTarget.dbUrl, file: sceneTarget.absFile, nodeCount: builder.nodeCount, animationCount: animationAssets.length };
    }

    private countStoryNodes(nodes: StoryAgentSceneNode[]): number {
        let count = 0;
        const walk = (list: StoryAgentSceneNode[]) => {
            for (const node of list) {
                if (node.nodeType === 'scene') {
                    if (Array.isArray(node.children)) walk(node.children);
                    continue;
                }
                count += 1;
                if (Array.isArray(node.children)) walk(node.children);
            }
        };
        walk(nodes);
        return count;
    }

    private sanitizeNodeName(name: string): string {
        return (name || 'Scene').replace(/[\\/:*?"<>|]/g, '_').trim() || 'Scene';
    }

    private isImageAsset(fileName: string): boolean {
        return /\.(png|jpe?g|gif|bmp|webp|tga|psd)$/i.test(fileName);
    }

    /** 解析 Spine atlas 文本，返回纹理页文件名（非缩进且以图片扩展名结尾的行） */
    private parseSpineAtlasPages(atlasBody: Buffer): string[] {
        const pages: string[] = [];
        for (const rawLine of atlasBody.toString('utf8').split(/\r?\n/)) {
            if (!rawLine.trim() || /^\s/.test(rawLine)) continue;
            if (/\.(png|jpe?g|webp|ktx2?|pkm|pvr)$/i.test(rawLine.trim())) pages.push(rawLine.trim());
        }
        return pages;
    }

    /** 读取 Spine 资产版本号：.json 读 skeleton.version；.skel 扫描文件头部定位版本字符串
     *  （hash 段布局因导出工具而异，可能是标准 varint 字符串或原始摘要字节，故不从头严格解析） */
    private detectSpineVersion(filePath: string): string | null {
        try {
            if (!fs.existsSync(filePath)) return null;
            if (/\.json$/i.test(filePath)) {
                const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return typeof json?.skeleton?.version === 'string' ? json.skeleton.version : null;
            }
            const data = fs.readFileSync(filePath);
            // 版本字符串格式：长度字节（含末尾 \0）+ "主.次[.修订]" ASCII
            const limit = Math.min(data.length, 128);
            for (let pos = 0; pos < limit; pos += 1) {
                const length = data[pos];
                if (length < 3 || length > 32 || pos + length > data.length) continue;
                const candidate = data.subarray(pos + 1, pos + length).toString('ascii');
                if (/^\d+\.\d+(\.\d+)?$/.test(candidate)) return candidate;
            }
            return null;
        } catch {
            return null;
        }
    }

    /** 项目功能裁剪配置中是否已启用 spine-4.2（未配置时为默认引擎，即 Spine 3.8） */
    private isSpine42FeatureEnabled(): boolean {
        try {
            const text = fs.readFileSync(path.join(Editor.Project.path, 'settings', 'v2', 'packages', 'engine.json'), 'utf8');
            return text.includes('spine-4.2');
        } catch {
            return false;
        }
    }

    private sanitizeFolder(folder: string): string {
        const cleaned = (folder || '').trim().replace(/^\/+|\/+$/g, '');
        if (!cleaned) return '';
        if (cleaned.includes('..') || cleaned.includes('\\')) return '';
        return cleaned;
    }

    private resolveAnimationAssetDir(animName: string, uuid?: string): { dir: string; url: string } {
        const safeName = this.sanitizeNodeName(animName);
        const baseDir = path.join(Editor.Project.path, 'assets', 'res', 'animations', safeName);
        const tryDir = (suffix: string) => path.join(Editor.Project.path, 'assets', 'res', 'animations', safeName + suffix);
        const animFile = (dir: string) => path.join(dir, `${safeName}.anim`);

        // 同名目录已存在且 meta uuid 一致（重复导入同一 clip）→ 复用原目录，避免产生 _1/_2 副本与 uuid 冲突
        if (uuid && fs.existsSync(animFile(baseDir))) {
            try {
                const meta = JSON.parse(fs.readFileSync(`${animFile(baseDir)}.meta`, 'utf8'));
                if (meta.uuid === uuid) {
                    const relative = path.relative(path.join(Editor.Project.path, 'assets'), baseDir).replace(/\\/g, '/');
                    return { dir: baseDir, url: `db://assets/${relative}` };
                }
            } catch {
                // meta 读取失败时回退到新建后缀目录的原有逻辑
            }
        }

        let dir = baseDir;
        let counter = 1;
        while (fs.existsSync(animFile(dir))) {
            dir = tryDir(`_${counter}`);
            counter += 1;
        }

        const relative = path.relative(path.join(Editor.Project.path, 'assets'), dir).replace(/\\/g, '/');
        return { dir, url: `db://assets/${relative}` };
    }
}

export class CocosSceneBuilder {
    private items: CocosJsonItem[] = [];
    private animationAssets: Array<{ uuid: string; name: string; fileName: string; items: CocosJsonItem[]; meta: CocosJsonItem }> = [];
    /** StoryAgent 节点 id → 场景树路径，用于解析动画 track.targetNodeId 指向的目标节点 */
    private nodePathById = new Map<string, string[]>();
    nodeCount = 0;

    constructor(private sceneName: string, private assetMap: Map<string, ImportedAssetInfo>) {}

    build(nodes: StoryAgentSceneNode[]): CocosJsonItem[] {
        this.items = [];
        this.animationAssets = [];
        this.nodePathById = new Map();
        // 预遍历先建好全树 id→路径 索引：动画 clip 在属主节点构建时就要解析 targetNodeId，
        // 此时目标节点（往往是属主的子节点/兄弟节点）尚未递归构建
        this.indexNodePaths(nodes);
        this.push({ __type__: 'cc.SceneAsset', _name: this.sceneName, _objFlags: 0, __editorExtras__: {}, _native: '', scene: { __id__: 1 } });
        this.push(this.makeScene());
        this.push(this.makeSceneGlobals());
        this.push(this.makeAmbientInfo());
        this.push(this.makeSkyboxInfo());
        this.push(this.makeFogInfo());
        this.push(this.makeOctreeInfo());
        for (const node of nodes) {
            if (node.nodeType === 'scene') {
                // 场景根节点只作为容器名，不创建 Cocos 节点；子节点提升到场景顶层
                for (const child of node.children ?? []) {
                    const childId = this.buildNodeRecursive(child, 1, []);
                    this.items[1]._children.push({ __id__: childId });
                }
            } else {
                const childId = this.buildNodeRecursive(node, 1, []);
                this.items[1]._children.push({ __id__: childId });
            }
        }
        return this.items;
    }

    getAnimationAssets(): Array<{ uuid: string; name: string; fileName: string; items: CocosJsonItem[]; meta: CocosJsonItem }> {
        return this.animationAssets;
    }

    /** 预遍历：填充 nodePathById，路径计算规则与 buildNodeRecursive 保持一致 */
    private indexNodePaths(nodes: StoryAgentSceneNode[]): void {
        const walk = (node: StoryAgentSceneNode, parentPath: string[]) => {
            if (node.nodeType === 'scene') {
                // 场景根节点不创建 Cocos 节点，子节点提升，与 build() 中的处理一致
                for (const child of node.children ?? []) walk(child, parentPath);
                return;
            }
            const nodePath = [...parentPath, node.name || node.id];
            this.nodePathById.set(node.id, nodePath);
            for (const child of node.children ?? []) walk(child, nodePath);
        };
        for (const node of nodes) walk(node, []);
    }

    private buildNodeRecursive(node: StoryAgentSceneNode, parentId: number, parentPath: string[]): number {
        const nodeId = this.push(this.makeNode(node, parentId));
        this.nodeCount += 1;
        const nodePath = [...parentPath, node.name || node.id];
        const componentIds = this.buildComponents(node, nodeId, nodePath);
        this.items[nodeId]._components = componentIds.map((id) => ({ __id__: id }));
        for (const child of node.children ?? []) {
            const childId = this.buildNodeRecursive(child, nodeId, nodePath);
            this.items[nodeId]._children.push({ __id__: childId });
        }
        return nodeId;
    }

    private buildComponents(node: StoryAgentSceneNode, nodeId: number, nodePath: string[]): number[] {
        const components: number[] = [];
        const ui = this.makeUITransform(nodeId, node);
        components.push(this.push(ui));
        if (this.isCanvas(node)) components.push(this.push(this.makeCanvas(nodeId, node)));
        const widget = this.getComponent(node, 'uiLayout');
        if (widget) components.push(this.push(this.makeWidget(nodeId, widget)));
        if (this.isSprite(node)) components.push(this.push(this.makeSprite(nodeId, node)));
        if (this.isLabel(node)) components.push(this.push(this.makeLabel(nodeId, node)));
        if (this.isSpine(node)) components.push(this.push(this.makeSpine(nodeId, node)));
        const opacity = this.getOpacity(node);
        if (opacity < 255) components.push(this.push(this.makeUIOpacity(nodeId, opacity)));
        if (node.animationClips && node.animationClips.length > 0) components.push(this.push(this.makeAnimation(nodeId, node, node.id, nodePath)));
        return components;
    }

    private push(item: CocosJsonItem): number {
        this.items.push(item);
        return this.items.length - 1;
    }

    private makeScene(): CocosJsonItem {
        return {
            __type__: 'cc.Scene', _name: this.sceneName, _objFlags: 0, __editorExtras__: {}, _parent: null, _children: [], _active: true,
            _components: [], _prefab: null, _lpos: this.vec3(0, 0, 0), _lrot: this.quat(), _lscale: this.vec3(1, 1, 1),
            _mobility: 0, _layer: 1073741824, _euler: this.vec3(0, 0, 0), autoReleaseAssets: false, _globals: { __id__: 2 }, _id: this.shortId('scene:' + this.sceneName),
        };
    }

    private makeSceneGlobals(): CocosJsonItem {
        return { __type__: 'cc.SceneGlobals', ambient: { __id__: 3 }, skybox: { __id__: 4 }, fog: { __id__: 5 }, octree: { __id__: 6 } };
    }

    private makeAmbientInfo(): CocosJsonItem {
        return {
            __type__: 'cc.AmbientInfo', _skyColorHDR: this.vec4(0.2, 0.5, 0.8, 0.520833), _skyColor: this.vec4(0.2, 0.5, 0.8, 0.520833),
            _skyIllumHDR: 20000, _skyIllum: 20000, _groundAlbedoHDR: this.vec4(0.2, 0.2, 0.2, 1), _groundAlbedo: this.vec4(0.2, 0.2, 0.2, 1),
        };
    }

    private makeSkyboxInfo(): CocosJsonItem {
        return { __type__: 'cc.SkyboxInfo', _envLightingType: 0, _envmapHDR: null, _envmap: null, _envmapLodCount: 0, _diffuseMapHDR: null, _diffuseMap: null, _enabled: false, _useHDR: true, _editableMaterial: null, _reflectionHDR: null, _reflectionMap: null, _rotationAngle: 0 };
    }

    private makeFogInfo(): CocosJsonItem {
        return { __type__: 'cc.FogInfo', _type: 0, _fogColor: this.color(200, 200, 200, 255), _enabled: false, _fogDensity: 0.3, _fogStart: 0.5, _fogEnd: 300, _fogAtten: 5, _fogTop: 1.5, _fogRange: 1.2, _accurate: false };
    }

    private makeOctreeInfo(): CocosJsonItem {
        return { __type__: 'cc.OctreeInfo', _enabled: false, _minPos: this.vec3(-1024, -1024, -1024), _maxPos: this.vec3(1024, 1024, 1024), _depth: 8 };
    }

    private makeNode(node: StoryAgentSceneNode, parentId: number): CocosJsonItem {
        const position = node.position ?? [0, 0, 0];
        const scale = node.scale ?? [1, 1, 1];
        const euler = this.toEulerDegrees(node.rotation ?? [0, 0, 0]);
        return {
            __type__: 'cc.Node', _name: node.name || node.id, _objFlags: 0, __editorExtras__: {}, _parent: { __id__: parentId }, _children: [],
            _active: node.visible !== false, _components: [], _prefab: null, _lpos: this.vec3(position[0] * 100, position[1] * 100, position[2] * 100),
            _lrot: this.quat(), _lscale: this.vec3(scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1), _mobility: 0, _layer: 33554432,
            _euler: this.vec3(euler[0], euler[1], euler[2]), _id: this.shortId(`node:${node.id}`),
        };
    }

    private makeUITransform(nodeId: number, node: StoryAgentSceneNode): CocosJsonItem {
        const uiComp = this.getComponent(node, 'uiTransform');
        const size = this.resolveContentSize(node);
        return {
            __type__: 'cc.UITransform', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null,
            _contentSize: { __type__: 'cc.Size', width: this.num(uiComp?.props?.width, size.width), height: this.num(uiComp?.props?.height, size.height) },
            _anchorPoint: { __type__: 'cc.Vec2', x: this.num(uiComp?.props?.pivotX, 0.5), y: this.num(uiComp?.props?.pivotY, 0.5) }, _id: this.shortId(`ui:${nodeId}`),
        };
    }

    private makeCanvas(nodeId: number, node: StoryAgentSceneNode): CocosJsonItem {
        const comp = this.getComponent(node, 'canvas');
        const size = this.resolveContentSize(node, 1280, 720);
        return {
            __type__: 'cc.Canvas', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null,
            _cameraComponent: null, _alignCanvasWithScreen: true,
            _designResolution: { __type__: 'cc.Size', width: this.num(comp?.props?.referenceWidth, size.width), height: this.num(comp?.props?.referenceHeight, size.height) },
            _fitWidth: this.bool(comp?.props?.fitWidth, true), _fitHeight: this.bool(comp?.props?.fitHeight, false), _id: this.shortId(`canvas:${nodeId}`),
        };
    }

    private makeWidget(nodeId: number, comp: { props?: Record<string, any> }): CocosJsonItem {
        const p = comp.props ?? {};
        let flags = 0;
        if (this.bool(p.leftEnabled, false)) flags |= 1 << 1;
        if (this.bool(p.rightEnabled, false)) flags |= 1 << 2;
        if (this.bool(p.topEnabled, false)) flags |= 1 << 3;
        if (this.bool(p.bottomEnabled, false)) flags |= 1 << 4;
        if (this.bool(p.horizontalCenterEnabled, false)) flags |= 1 << 5;
        if (this.bool(p.verticalCenterEnabled, false)) flags |= 1 << 6;
        return {
            __type__: 'cc.Widget', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: p.enabled !== false, __prefab: null,
            _alignFlags: flags, _target: null, _left: this.num(p.left, 0), _right: this.num(p.right, 0), _top: this.num(p.top, 0), _bottom: this.num(p.bottom, 0),
            _horizontalCenter: this.num(p.horizontalCenter, 0), _verticalCenter: this.num(p.verticalCenter, 0), _isAbsLeft: true, _isAbsRight: true, _isAbsTop: true,
            _isAbsBottom: true, _isAbsHorizontalCenter: true, _isAbsVerticalCenter: true, _id: this.shortId(`widget:${nodeId}`),
        };
    }

    private makeSprite(nodeId: number, node: StoryAgentSceneNode): CocosJsonItem {
        const c = this.parseColor(node.tintColor ?? '#ffffffff');
        const spriteFrame = this.resolveSpriteFrame(node.spriteFrame);
        return {
            __type__: 'cc.Sprite', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null,
            _srcBlendFactor: 2, _dstBlendFactor: 4, _color: this.color(c.r, c.g, c.b, c.a), _sharedMaterial: null, _spriteFrame: spriteFrame,
            _type: 0, _fillType: 0, _sizeMode: 0, _fillCenter: { __type__: 'cc.Vec2', x: 0, y: 0 }, _fillStart: 0, _fillRange: 0,
            _isTrimmedMode: true, _useGrayscale: false, _atlas: null, _id: this.shortId(`sprite:${nodeId}`),
        };
    }

    private makeLabel(nodeId: number, node: StoryAgentSceneNode): CocosJsonItem {
        const c = this.parseColor(node.tintColor ?? node.fontColor ?? '#ffffffff');
        const fontSize = node.fontSize ?? 24;
        return {
            __type__: 'cc.Label', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null,
            _string: node.labelText ?? 'Label', _fontSize: fontSize, _lineHeight: Math.round(fontSize * 1.2), _overflow: 0, _enableWrapText: true,
            _isSystemFontUsed: true, _font: null, _color: this.color(c.r, c.g, c.b, c.a), _horizontalAlign: 1, _verticalAlign: 1, _id: this.shortId(`label:${nodeId}`),
        };
    }

    private makeSpine(nodeId: number, node: StoryAgentSceneNode): CocosJsonItem {
        const skeleton = this.resolveAssetUuid(node.spineSkeleton, 'sp.SkeletonData');
        return {
            __type__: 'sp.Skeleton', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null,
            _customMaterial: null, _visFlags: 0, _color: this.color(255, 255, 255, 255), _skeletonData: skeleton, _defaultSkin: node.spineSkin ?? '',
            _defaultAnim: node.spineAnimation ?? '', _animationName: node.spineAnimation ?? '', _loop: node.spineLoop !== false,
            _paused: node.spinePlaying === false, _premultipliedAlpha: node.spinePremultipliedAlpha !== false, _timeScale: node.spineTimeScale ?? 1, _debugSlots: false, _debugBones: false,
            _debugMesh: false, _useTint: false, _enableBatch: true, _id: this.shortId(`spine:${nodeId}`),
        };
    }

    private makeUIOpacity(nodeId: number, opacity: number): CocosJsonItem {
        return { __type__: 'cc.UIOpacity', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null, _opacity: opacity, _id: this.shortId(`opacity:${nodeId}`) };
    }

    private makeAnimation(nodeId: number, node: StoryAgentSceneNode, ownerId: string, nodePath: string[]): CocosJsonItem {
        const clips = node.animationClips ?? [];
        const refs = clips.map((clip) => {
            const uuid = this.generateCocosUuid(`anim:${clip.name}:${clip.id}`);
            const safeName = this.sanitizeFileName(clip.name || clip.id);
            const items = this.buildAnimationClip(clip, ownerId, nodePath);
            this.animationAssets.push({ uuid, name: clip.name, fileName: `${safeName}.anim`, items, meta: this.buildAnimationClipMeta(uuid, clip.name) });
            return { __uuid__: uuid, __expectedType__: 'cc.AnimationClip' };
        });
        return {
            __type__: 'cc.Animation', _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null,
            _defaultClip: refs[0] ?? null, _clips: refs, _playOnLoad: false, _id: this.shortId(`animation:${nodeId}`),
        };
    }

    private buildAnimationClip(clip: StoryAgentAnimationClip, ownerId: string, ownerPath: string[]): CocosJsonItem[] {
        const items: CocosJsonItem[] = [];
        const push = (item: CocosJsonItem): number => { items.push(item); return items.length - 1; };
        const clipId = push({ __type__: 'cc.AnimationClip', _name: clip.name, _duration: clip.duration, sample: clip.fps, speed: clip.speed ?? 1, wrapMode: clip.wrapMode === 'loop' ? 2 : clip.wrapMode === 'pingPong' ? 22 : 1, _tracks: [], _embeddedPlayers: [], _additiveSettings: null, _hash: this.stableHash(`${clip.name}:${clip.id}`), _id: '' });
        const groups = new Map<string, { targetId: string; group: string | null; tracks: StoryAgentAnimationTrack[] }>();
        for (const track of clip.tracks ?? []) {
            const targetId = track.targetNodeId || ownerId;
            const group = this.vectorGroup(track.property);
            const key = group ? `${targetId}|${group}` : `${targetId}|__scalar|${track.property}`;
            const entry = groups.get(key) ?? { targetId, group, tracks: [] };
            entry.tracks.push(track);
            groups.set(key, entry);
        }
        for (const { targetId, group: groupName, tracks } of groups.values()) {
            const property = groupName ? this.vectorGroupToCocosProperty(groupName) : tracks[0].property;
            const component = groupName === 'tintColor' ? 'cc.Sprite' : null;
            const relativePath = this.resolveRelativePath(ownerId, ownerPath, targetId);
            const trackPathId = this.makeTrackPath(push, relativePath, property, component);
            if (groupName) {
                const order = this.vectorComponentOrder(groupName);
                const orderedTracks = order.map((prop) => tracks.find((track) => track.property === prop)).filter(Boolean) as StoryAgentAnimationTrack[];
                const channelCount = groupName === 'tintColor' ? orderedTracks.length : 4;
                const channels = this.makeVectorChannels(push, orderedTracks, channelCount);
                const trackId = push({ __type__: groupName === 'tintColor' ? 'cc.animation.ColorTrack' : 'cc.animation.VectorTrack', _channels: channels.map((id) => ({ __id__: id })), _binding: this.makeTrackBinding(trackPathId), _nComponents: groupName === 'tintColor' ? channels.length : Math.min(channels.length, 3), _id: '' });
                items[clipId]._tracks.push({ __id__: trackId });
            } else {
                const track = tracks[0];
                const curveId = push({ __type__: 'cc.ObjectCurve', _times: track.keyframes.map((kf) => kf.time), _values: track.keyframes.map((kf) => kf.value), _id: '' });
                const channelId = push({ __type__: 'cc.animation.Channel', _curve: { __id__: curveId }, _id: '' });
                const trackId = push({ __type__: 'cc.animation.ObjectTrack', _channel: { __id__: channelId }, _binding: this.makeTrackBinding(trackPathId), _id: '' });
                items[clipId]._tracks.push({ __id__: trackId });
            }
        }
        const additiveSettingsId = push({ __type__: 'cc.AnimationClipAdditiveSettings', enabled: false, refClip: null, _id: '' });
        items[clipId]._additiveSettings = { __id__: additiveSettingsId };
        return items;
    }

    private makeVectorChannels(push: (item: CocosJsonItem) => number, tracks: StoryAgentAnimationTrack[], channelCount: number): number[] {
        const times = [...new Set(tracks.flatMap((track) => track.keyframes.map((kf) => kf.time)))].sort((a, b) => a - b);
        const channels: number[] = [];
        for (const track of tracks) {
            const keyframes = new Map(track.keyframes.map((kf) => [kf.time, kf]));
            const curveId = push({ __type__: 'cc.RealCurve', _times: times, _values: times.map((time) => this.makeRealKeyframeValue(keyframes.get(time), keyframes.get(time)?.value ?? 0)), preExtrapolation: 1, postExtrapolation: 1, _id: '' });
            channels.push(push({ __type__: 'cc.animation.Channel', _curve: { __id__: curveId }, _id: '' }));
        }
        while (channels.length < channelCount) {
            const curveId = push({ __type__: 'cc.RealCurve', _times: [], _values: [], preExtrapolation: 1, postExtrapolation: 1, _id: '' });
            channels.push(push({ __type__: 'cc.animation.Channel', _curve: { __id__: curveId }, _id: '' }));
        }
        return channels;
    }

    /**
     * 解析动画目标节点相对 clip 属主节点的路径：
     * - 目标是属主自身 → []
     * - 目标在属主子树内 → 向下子路径
     * - 目标是祖先/兄弟 → '..' 上溯后再向下
     * - 找不到目标（如已被剔除的节点）→ 回退到属主自身
     */
    private resolveRelativePath(ownerId: string, ownerPath: string[], targetId: string): string[] {
        const targetPath = this.nodePathById.get(targetId);
        if (!targetId || targetId === ownerId || !targetPath) return [];
        let common = 0;
        while (common < ownerPath.length && common < targetPath.length && ownerPath[common] === targetPath[common]) common += 1;
        const ups = ownerPath.length - common;
        return [...Array(ups).fill('..'), ...targetPath.slice(common)];
    }

    private makeTrackPath(push: (item: CocosJsonItem) => number, nodePath: string[], property: string, component: string | null): number {
        const refs = nodePath.map((name) => ({ __id__: push({ __type__: 'cc.animation.HierarchyPath', path: name, _id: '' }) }));
        if (component) refs.push({ __id__: push({ __type__: 'cc.animation.ComponentPath', component, _id: '' }) });
        return push({ __type__: 'cc.animation.TrackPath', _paths: [...refs, property], _id: '' });
    }

    private makeTrackBinding(trackPathId: number): CocosJsonItem {
        return { __type__: 'cc.animation.TrackBinding', path: { __id__: trackPathId }, proxy: null };
    }

    private makeRealKeyframeValue(keyframe: StoryAgentKeyframe | undefined, value: unknown): CocosJsonItem {
        const interpolation = keyframe?.interpolation ?? 'linear';
        return { __type__: 'cc.RealKeyframeValue', interpolationMode: interpolation === 'step' ? 1 : interpolation === 'bezier' ? 2 : 0, tangentWeightMode: 0, value, rightTangent: 0, rightTangentWeight: 1, leftTangent: 0, leftTangentWeight: 1, easingMethod: 0, __editorExtras__: null, easing: this.interpToEasing(keyframe) };
    }

    private buildAnimationClipMeta(uuid: string, clipName: string): CocosJsonItem {
        return { ver: '2.0.3', importer: 'animation-clip', imported: true, uuid, files: ['.cconb'], subMetas: {}, userData: { name: clipName } };
    }

    private resolveContentSize(node: StoryAgentSceneNode, fallbackWidth = 100, fallbackHeight = 100): { width: number; height: number } {
        if (node.contentSize) return { width: node.contentSize.width, height: node.contentSize.height };
        if (this.isLabel(node)) {
            const fontSize = node.fontSize ?? 24;
            return { width: Math.ceil(String(node.labelText ?? 'Label').length * fontSize * 0.6), height: Math.ceil(fontSize * 1.4) };
        }
        const asset = this.assetMap.get(this.normalizeAssetRef(node.spriteFrame));
        if (asset && this.isSprite(node)) return { width: fallbackWidth, height: fallbackHeight };
        return { width: fallbackWidth, height: fallbackHeight };
    }

    private resolveSpriteFrame(ref: string | undefined): CocosJsonItem | null {
        if (!ref) return null;
        if (ref.startsWith('cocos:')) return { __uuid__: ref.slice(6), __expectedType__: 'cc.SpriteFrame' };
        const asset = this.assetMap.get(this.normalizeAssetRef(ref));
        return asset?.spriteFrameUuid ? { __uuid__: asset.spriteFrameUuid, __expectedType__: 'cc.SpriteFrame' } : null;
    }

    private resolveAssetUuid(ref: string | undefined, expectedType: string): CocosJsonItem | null {
        if (!ref) return null;
        if (ref.startsWith('cocos:')) return { __uuid__: ref.slice(6), __expectedType__: expectedType };
        const asset = this.assetMap.get(this.normalizeAssetRef(ref));
        return asset?.uuid ? { __uuid__: asset.uuid, __expectedType__: expectedType } : null;
    }

    private getComponent(node: StoryAgentSceneNode, type: string): { type: string; label?: string; props?: Record<string, any> } | undefined {
        return node.components?.find((component) => component.type === type);
    }

    private isSprite(node: StoryAgentSceneNode): boolean { return node.meshType === 'sprite' || Boolean(node.spriteFrame); }
    private isLabel(node: StoryAgentSceneNode): boolean { return node.meshType === 'label' || node.labelText !== undefined; }
    private isCanvas(node: StoryAgentSceneNode): boolean { return node.meshType === 'canvas' || Boolean(this.getComponent(node, 'canvas')); }
    private isSpine(node: StoryAgentSceneNode): boolean { return node.meshType === 'spine' || Boolean(node.spineSkeleton); }

    private getOpacity(node: StoryAgentSceneNode): number {
        const color = this.parseColor(node.tintColor ?? '#ffffffff');
        return color.a;
    }

    private vectorGroup(property: string): string | null {
        if (property.startsWith('position.')) return 'position';
        if (property.startsWith('rotation.')) return 'rotation';
        if (property.startsWith('scale.')) return 'scale';
        if (property.startsWith('tintColor.')) return 'tintColor';
        return null;
    }

    private vectorGroupToCocosProperty(group: string): string {
        if (group === 'tintColor') return 'color';
        if (group === 'rotation') return 'eulerAngles';
        return group;
    }

    private vectorComponentOrder(group: string): string[] {
        if (group === 'tintColor') return ['tintColor.r', 'tintColor.g', 'tintColor.b', 'tintColor.a'];
        if (group === 'position') return ['position.x', 'position.y', 'position.z'];
        if (group === 'rotation') return ['rotation.x', 'rotation.y', 'rotation.z'];
        if (group === 'scale') return ['scale.x', 'scale.y', 'scale.z'];
        return [];
    }

    private interpToEasing(keyframe: StoryAgentKeyframe | undefined): string | number[] {
        if (!keyframe) return 'linear';
        if (keyframe.interpolation === 'bezier' && keyframe.bezierRight && keyframe.bezierLeft) return [...keyframe.bezierRight, ...keyframe.bezierLeft];
        return keyframe.interpolation || 'linear';
    }

    private normalizeAssetRef(value: string | undefined): string {
        return String(value || '').replace(/^asset:/, '');
    }

    private sanitizeFileName(name: string): string {
        return (name || 'Animation').replace(/[\\/:*?"<>|]/g, '_').trim() || 'Animation';
    }

    private parseColor(value: string): { r: number; g: number; b: number; a: number } {
        const hex = value.trim().replace(/^#/, '');
        if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) return { r: 255, g: 255, b: 255, a: 255 };
        return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 255 };
    }

    private toEulerDegrees(value: [number, number, number]): [number, number, number] {
        return value.map((n) => Math.abs(Number(n) || 0) <= Math.PI * 2 ? (Number(n) || 0) * 180 / Math.PI : Number(n) || 0) as [number, number, number];
    }

    private num(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
    private bool(value: unknown, fallback: boolean): boolean { return typeof value === 'boolean' ? value : fallback; }
    private vec3(x: number, y: number, z: number): CocosJsonItem { return { __type__: 'cc.Vec3', x, y, z }; }
    private vec4(x: number, y: number, z: number, w: number): CocosJsonItem { return { __type__: 'cc.Vec4', x, y, z, w }; }
    private quat(): CocosJsonItem { return { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 }; }
    private color(r: number, g: number, b: number, a: number): CocosJsonItem { return { __type__: 'cc.Color', r, g, b, a }; }
    private stableHash(value: string): number { return crypto.createHash('md5').update(value).digest().readInt32LE(0); }
    private generateCocosUuid(seed: string): string { const hex = crypto.createHash('md5').update(seed).digest('hex'); return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`; }
    private shortId(seed: string): string { return crypto.createHash('sha1').update(seed).digest('base64').replace(/[=+/]/g, '').slice(0, 22); }
}
