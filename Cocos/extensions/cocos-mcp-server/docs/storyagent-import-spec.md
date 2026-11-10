# StoryAgent 关卡导入 — MCP 插件扩展规格

> 目标：在 `extensions/cocos-mcp-server` 插件内新增 `storyagent` 工具组，
> 通过配置 StoryAgent 服务器地址 + 账号密码，HTTP 拉取项目全部关卡资源（scene.json + 资产）
> 并导入 Cocos 工程（`assets/resources/puzzles/` + `assets/resources/`）。

## 依赖的 StoryAgent HTTP API（已确认存在，无需改服务端）

| API | 用途 |
|---|---|
| `POST {baseUrl}/api/auth/login` | body `{username, password}` → `{success, token, user}`；后续请求带 `Cookie: storyagent_token=<token>`（TOKEN_NAME 已确认） |
| `GET {baseUrl}/api/projects` | 项目列表 `{projects:[{id,title,projectType,...}]}` |
| `GET {baseUrl}/api/projects/[id]` | 项目详情（novel + project） |
| `GET {baseUrl}/api/novels/[id]/assets?folder=Scenes` | 资产列表 `{assets:[{id,fileName,folderPath,mimeType,fileSize}]}`；folder 省略 = 根目录 |
| `GET {baseUrl}/api/novels/[id]/assets?folder=X&download=folder` | 目录 ZIP（备用） |
| `GET {baseUrl}/api/novels/[id]/assets/[assetId]` | 资产文件内容（scene.json 为 JSON，其余为二进制） |

## 配置（settings/mcp-server.json）

```jsonc
{
  // ...现有字段
  "storyAgent": {
    "baseUrl": "http://127.0.0.1:3000",
    "username": "",
    "password": "",
    "token": "",
    "tokenExpiresAt": null
  }
}
```
- `MCPServerSettings` 类型新增 `storyAgent?: StoryAgentSettings`
- `readSettings/saveSettings` 透传即可（JSON 序列化天然支持）
- 密码明文存储于本地 settings，属开发期可接受；`connect` 成功后缓存 token，优先用 token

## 工具清单（category = storyagent）

### storyagent_connect
- 参数：`{ baseUrl?, username?, password? }`（不传则用 settings）
- 动作：校验必填 → POST login → 成功存 `{baseUrl, username, token, tokenExpiresAt}` 到 settings → 返回 `{success, user, baseUrl, tokenPrefix}`
- 失败：401 提示账号密码错误；网络错误提示连通性

### storyagent_list_projects
- 参数：`{}`
- 动作：GET `/api/projects` → 返回 `{projects:[{id,title,projectType,updatedAt}]}`
- 前置：未配置 token → 报错"请先 connect"

### storyagent_import_project
- 参数：`{ projectId, includeAssets?: boolean(默认true), overwrite?: boolean(默认true) }`
- 动作：
  1. 拉全量资产元数据：`GET /api/novels/[id]/assets`（根目录）+ 递归 `subFolders` → 建 `Map<assetId, {fileName,folderPath,mimeType}>`
  2. 从元数据筛出 `*.scene.json`（优先 Scenes 目录，否则全项目）
  3. 逐个下载 scene.json → 校验 `metadata.type === "StoryAgent-Scene"` 且 `scene.nodes` 为数组
  4. 提取 `puzzleGraph`（USLScript）→ 生成 nodeMap（遍历 scene 节点树）
  5. 组装 `PuzzleGraphBundle {script, nodeMap}` → 写 `assets/resources/puzzles/<projectId>/<sceneName>.json`
  6. 若 `includeAssets`：扫描 scene 中资产引用字段（spriteFrame/spineSkeleton/spineAtlas/backgroundTexture/environmentTexture 及 params 中的 `asset:<id>`）→ 对每个 assetId 下载二进制 → 写 `assets/resources/<folder>/<fileName>`（文件夹名清洗，防 `..`）
  7. `asset-db` refresh 新增目录
- 返回：`{importedScenes:[{sceneName,nodeCount,connectionCount,nodeMapCount}], importedAssets:[{fileName,folderPath}], skipped:[...]}`

## nodeMap 生成规则

```
遍历 SceneNode 树：
  path = 根到当前节点 name 用 "/" 拼接（如 "Canvas/TargetSprite"）
  nodeMap[node.id] = { path, name: node.name }
```
- 根节点直接以自身 name 为路径
- 忽略 nodeType 为 "scene" 的容器？——保留，全部节点都记录（Runtime 只查被引用的）

## 资产写入规则

- 目标根：`assets/resources/`
- 子目录映射：`folderPath` 清洗（去 `/` 头尾、拒绝 `..`），如 `Textures` → `assets/resources/Textures/<fileName>`
- 文件名沿用源 fileName（保留扩展名）
- 写盘用 Node fs（插件主进程），随后 `Editor.Message.request('asset-db', 'refresh-asset', url)`

## 认证与错误处理

- 请求统一封装 `storyagentFetch(path, {method, body, isJson})`：注入 `Cookie: storyagent_token=<token>`；`baseUrl` 从 settings 读
- 401 → 抛"登录已过期，请重新 connect"
- 网络错误 → 抛"无法连接 StoryAgent（检查 baseUrl）"
- 单文件失败不中断整体导入（记入 skipped 并 warn）

## 文件改动清单

| 文件 | 改动 |
|---|---|
| `source/types.ts` | 新增 `StoryAgentSettings`，`MCPServerSettings` 加 `storyAgent?` |
| `source/settings.ts` | `readSettings/saveSettings` 已覆盖，无需改（透传）；如需合并默认值可加 |
| `source/tools/storyagent-tools.ts` | 新文件：HTTP 客户端 + 3 个工具 |
| `source/mcp-server.ts` | `initializeTools` 注册 `this.tools.storyagent = new StoryAgentTools()` |
| `source/main.ts` | 新增 `updateStoryAgentSettings` / `getStoryAgentSettings` 方法（可选） |

## 验收标准

- [ ] `storyagent_connect` 用正确账号密码返回成功并持久化 token
- [ ] `storyagent_list_projects` 返回 StoryAgent 真实项目列表
- [ ] `storyagent_import_project` 导入 demo 项目：`assets/resources/puzzles/<id>/<关卡>.json` 含 script+nodeMap
- [ ] `includeAssets` 时贴图/音频按元数据写入 `assets/resources/` 且资源库可刷新
- [ ] 错误 token / 错误 baseUrl 给出可读错误信息
- [ ] 插件整体编译无 TS 错误（tsc 通过）
