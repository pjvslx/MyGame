"use strict";
/* eslint-disable vue/one-component-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = require("vue");
const panelDataMap = new WeakMap();
module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log('[MCP Panel] Panel shown');
        },
        hide() {
            console.log('[MCP Panel] Panel hidden');
        },
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle',
    },
    ready() {
        if (this.$.app) {
            const app = (0, vue_1.createApp)({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            // 创建主应用组件
            app.component('McpServerApp', (0, vue_1.defineComponent)({
                setup() {
                    // 响应式数据
                    const activeTab = (0, vue_1.ref)('server');
                    const serverRunning = (0, vue_1.ref)(false);
                    const serverStatus = (0, vue_1.ref)('已停止');
                    const connectedClients = (0, vue_1.ref)(0);
                    const httpUrl = (0, vue_1.ref)('');
                    const isProcessing = (0, vue_1.ref)(false);
                    const settings = (0, vue_1.ref)({
                        port: 3000,
                        autoStart: false,
                        debugLog: false,
                        maxConnections: 10
                    });
                    // StoryAgent 接入配置
                    const storyAgent = (0, vue_1.ref)({ baseUrl: '', username: '', password: '' });
                    const storyAgentStatus = (0, vue_1.ref)('未连接');
                    const storyAgentConnecting = (0, vue_1.ref)(false);
                    const storyAgentProjects = (0, vue_1.ref)([]);
                    const storyAgentLoadingProjects = (0, vue_1.ref)(false);
                    const importingProject = (0, vue_1.ref)('');
                    const importResults = (0, vue_1.ref)({});
                    const availableTools = (0, vue_1.ref)([]);
                    const toolCategories = (0, vue_1.ref)([]);
                    // 计算属性
                    const statusClass = (0, vue_1.computed)(() => ({
                        'status-running': serverRunning.value,
                        'status-stopped': !serverRunning.value
                    }));
                    const totalTools = (0, vue_1.computed)(() => availableTools.value.length);
                    const enabledTools = (0, vue_1.computed)(() => availableTools.value.filter(t => t.enabled).length);
                    const disabledTools = (0, vue_1.computed)(() => totalTools.value - enabledTools.value);
                    const settingsChanged = (0, vue_1.ref)(false);
                    // 方法
                    const switchTab = (tabName) => {
                        activeTab.value = tabName;
                        if (tabName === 'tools') {
                            loadToolManagerState();
                        }
                    };
                    const toggleServer = async () => {
                        try {
                            if (serverRunning.value) {
                                await Editor.Message.request('cocos-mcp-server', 'stop-server');
                            }
                            else {
                                // 启动服务器时使用当前面板设置
                                const currentSettings = {
                                    port: settings.value.port,
                                    autoStart: settings.value.autoStart,
                                    enableDebugLog: settings.value.debugLog,
                                    maxConnections: settings.value.maxConnections
                                };
                                await Editor.Message.request('cocos-mcp-server', 'update-settings', currentSettings);
                                await Editor.Message.request('cocos-mcp-server', 'start-server');
                            }
                            console.log('[Vue App] Server toggled');
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to toggle server:', error);
                        }
                    };
                    const saveSettings = async () => {
                        try {
                            // 创建一个简单的对象，避免克隆错误
                            const settingsData = {
                                port: settings.value.port,
                                autoStart: settings.value.autoStart,
                                debugLog: settings.value.debugLog,
                                maxConnections: settings.value.maxConnections
                            };
                            const result = await Editor.Message.request('cocos-mcp-server', 'update-settings', settingsData);
                            console.log('[Vue App] Save settings result:', result);
                            settingsChanged.value = false;
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    };
                    const copyUrl = async () => {
                        try {
                            await navigator.clipboard.writeText(httpUrl.value);
                            console.log('[Vue App] URL copied to clipboard');
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to copy URL:', error);
                        }
                    };
                    const loadToolManagerState = async () => {
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'getToolManagerState');
                            if (result && result.success) {
                                // 总是加载后端状态，确保数据是最新的
                                availableTools.value = result.availableTools || [];
                                console.log('[Vue App] Loaded tools:', availableTools.value.length);
                                // 更新工具分类
                                const categories = new Set(availableTools.value.map(tool => tool.category));
                                toolCategories.value = Array.from(categories);
                            }
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    };
                    const updateToolStatus = async (category, name, enabled) => {
                        try {
                            console.log('[Vue App] updateToolStatus called:', category, name, enabled);
                            // 先更新本地状态
                            const toolIndex = availableTools.value.findIndex(t => t.category === category && t.name === name);
                            if (toolIndex !== -1) {
                                availableTools.value[toolIndex].enabled = enabled;
                                // 强制触发响应式更新
                                availableTools.value = [...availableTools.value];
                                console.log('[Vue App] Local state updated, tool enabled:', availableTools.value[toolIndex].enabled);
                            }
                            // 调用后端更新
                            const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatus', category, name, enabled);
                            if (!result || !result.success) {
                                // 如果后端更新失败，回滚本地状态
                                if (toolIndex !== -1) {
                                    availableTools.value[toolIndex].enabled = !enabled;
                                    availableTools.value = [...availableTools.value];
                                }
                                console.error('[Vue App] Backend update failed, rolled back local state');
                            }
                            else {
                                console.log('[Vue App] Backend update successful');
                            }
                        }
                        catch (error) {
                            // 如果发生错误，回滚本地状态
                            const toolIndex = availableTools.value.findIndex(t => t.category === category && t.name === name);
                            if (toolIndex !== -1) {
                                availableTools.value[toolIndex].enabled = !enabled;
                                availableTools.value = [...availableTools.value];
                            }
                            console.error('[Vue App] Failed to update tool status:', error);
                        }
                    };
                    const selectAllTools = async () => {
                        try {
                            // 直接更新本地状态，然后保存
                            availableTools.value.forEach(tool => tool.enabled = true);
                            await saveChanges();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to select all tools:', error);
                        }
                    };
                    const deselectAllTools = async () => {
                        try {
                            // 直接更新本地状态，然后保存
                            availableTools.value.forEach(tool => tool.enabled = false);
                            await saveChanges();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to deselect all tools:', error);
                        }
                    };
                    const saveChanges = async () => {
                        try {
                            // 创建普通对象，避免Vue3响应式对象克隆错误
                            const updates = availableTools.value.map(tool => ({
                                category: String(tool.category),
                                name: String(tool.name),
                                enabled: Boolean(tool.enabled)
                            }));
                            console.log('[Vue App] Sending updates:', updates.length, 'tools');
                            const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', updates);
                            if (result && result.success) {
                                console.log('[Vue App] Tool changes saved successfully');
                            }
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to save tool changes:', error);
                        }
                    };
                    const toggleCategoryTools = async (category, enabled) => {
                        try {
                            // 直接更新本地状态，然后保存
                            availableTools.value.forEach(tool => {
                                if (tool.category === category) {
                                    tool.enabled = enabled;
                                }
                            });
                            await saveChanges();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to toggle category tools:', error);
                        }
                    };
                    const getToolsByCategory = (category) => {
                        return availableTools.value.filter(tool => tool.category === category);
                    };
                    // ── StoryAgent 接入 ──
                    const loadStoryAgentSettings = async () => {
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'getStoryAgentSettings');
                            if (result && result.success && result.storyAgent) {
                                storyAgent.value = {
                                    baseUrl: result.storyAgent.baseUrl || '',
                                    username: result.storyAgent.username || '',
                                    password: result.storyAgent.password || '',
                                };
                                if (result.storyAgent.token) {
                                    storyAgentStatus.value = `已连接（${result.storyAgent.username || '未知用户'}）`;
                                }
                            }
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to load storyagent settings:', error);
                        }
                    };
                    const saveAndConnectStoryAgent = async () => {
                        var _a, _b;
                        storyAgentConnecting.value = true;
                        try {
                            const cfg = {
                                baseUrl: storyAgent.value.baseUrl,
                                username: storyAgent.value.username,
                                password: storyAgent.value.password,
                            };
                            await Editor.Message.request('cocos-mcp-server', 'updateStoryAgentSettings', cfg);
                            const result = await Editor.Message.request('cocos-mcp-server', 'storyAgentConnect', {});
                            if (result && result.success) {
                                storyAgentStatus.value = `已连接（${((_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.username) || storyAgent.value.username}）`;
                                console.log('[Vue App] StoryAgent connected:', result.message);
                                await refreshStoryAgentProjects();
                            }
                            else {
                                storyAgentStatus.value = `连接失败：${(result === null || result === void 0 ? void 0 : result.error) || '未知错误'}`;
                            }
                        }
                        catch (error) {
                            storyAgentStatus.value = `连接失败：${error.message || error}`;
                        }
                        finally {
                            storyAgentConnecting.value = false;
                        }
                    };
                    // 刷新项目列表
                    const refreshStoryAgentProjects = async () => {
                        var _a;
                        storyAgentLoadingProjects.value = true;
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'storyAgentListProjects');
                            if (result && result.success) {
                                storyAgentProjects.value = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.projects) || [];
                            }
                            else {
                                storyAgentProjects.value = [];
                                if (result === null || result === void 0 ? void 0 : result.error) {
                                    storyAgentStatus.value = `获取项目失败：${result.error}`;
                                }
                            }
                        }
                        catch (error) {
                            storyAgentProjects.value = [];
                            storyAgentStatus.value = `获取项目失败：${error.message || error}`;
                        }
                        finally {
                            storyAgentLoadingProjects.value = false;
                        }
                    };
                    // 导入指定项目
                    const importStoryAgentProject = async (projectId) => {
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        importingProject.value = projectId;
                        importResults.value = Object.assign(Object.assign({}, importResults.value), { [projectId]: '导入中…' });
                        try {
                            const result = await Editor.Message.request('cocos-mcp-server', 'storyAgentImportProject', { projectId });
                            if (result && result.success) {
                                const data = result.data || {};
                                const scenes = (_b = (_a = data.importedScenes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                                const assets = (_d = (_c = data.importedAssets) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0;
                                const cocosScenes = (_f = (_e = data.createdScenes) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0;
                                const nodeCount = (data.createdScenes || []).reduce((sum, item) => sum + (item.nodeCount || 0), 0);
                                const animationCount = (data.createdScenes || []).reduce((sum, item) => sum + (item.animationCount || 0), 0);
                                const skipped = (_h = (_g = data.skipped) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 0;
                                importResults.value = Object.assign(Object.assign({}, importResults.value), { [projectId]: `✔ 导入 ${scenes} 个关卡，${assets} 个资产，生成 ${cocosScenes} 个 Cocos 场景/${nodeCount} 个节点/${animationCount} 个动画${skipped ? `，跳过 ${skipped} 项` : ''}` });
                            }
                            else {
                                importResults.value = Object.assign(Object.assign({}, importResults.value), { [projectId]: `✘ ${(result === null || result === void 0 ? void 0 : result.error) || '导入失败'}` });
                            }
                        }
                        catch (error) {
                            importResults.value = Object.assign(Object.assign({}, importResults.value), { [projectId]: `✘ ${error.message || error}` });
                        }
                        finally {
                            importingProject.value = '';
                        }
                    };
                    const getCategoryDisplayName = (category) => {
                        const categoryNames = {
                            'scene': '场景工具',
                            'node': '节点工具',
                            'component': '组件工具',
                            'prefab': '预制体工具',
                            'project': '项目工具',
                            'debug': '调试工具',
                            'preferences': '偏好设置工具',
                            'server': '服务器工具',
                            'broadcast': '广播工具',
                            'sceneAdvanced': '高级场景工具',
                            'sceneView': '场景视图工具',
                            'referenceImage': '参考图片工具',
                            'assetAdvanced': '高级资源工具',
                            'validation': '验证工具'
                        };
                        return categoryNames[category] || category;
                    };
                    // 监听设置变化
                    (0, vue_1.watch)(settings, () => {
                        settingsChanged.value = true;
                    }, { deep: true });
                    // 组件挂载时加载数据
                    (0, vue_1.onMounted)(async () => {
                        // 加载工具管理器状态
                        await loadToolManagerState();
                        // 加载 StoryAgent 配置
                        await loadStoryAgentSettings();
                        // 从服务器状态获取设置信息
                        try {
                            const serverStatus = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                            if (serverStatus && serverStatus.settings) {
                                settings.value = {
                                    port: serverStatus.settings.port || 3000,
                                    autoStart: serverStatus.settings.autoStart || false,
                                    debugLog: serverStatus.settings.enableDebugLog || false,
                                    maxConnections: serverStatus.settings.maxConnections || 10
                                };
                                console.log('[Vue App] Server settings loaded from status:', serverStatus.settings);
                            }
                            else if (serverStatus && serverStatus.port) {
                                // 兼容旧版本，只获取端口信息
                                settings.value.port = serverStatus.port;
                                console.log('[Vue App] Port loaded from server status:', serverStatus.port);
                            }
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to get server status:', error);
                            console.log('[Vue App] Using default server settings');
                        }
                        // 定期更新服务器状态
                        setInterval(async () => {
                            try {
                                const result = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                                if (result) {
                                    serverRunning.value = result.running;
                                    serverStatus.value = result.running ? '运行中' : '已停止';
                                    connectedClients.value = result.clients || 0;
                                    httpUrl.value = result.running ? `http://localhost:${result.port}` : '';
                                    isProcessing.value = false;
                                }
                            }
                            catch (error) {
                                console.error('[Vue App] Failed to get server status:', error);
                            }
                        }, 2000);
                    });
                    return {
                        // 数据
                        activeTab,
                        serverRunning,
                        serverStatus,
                        connectedClients,
                        httpUrl,
                        isProcessing,
                        settings,
                        availableTools,
                        toolCategories,
                        settingsChanged,
                        storyAgent,
                        storyAgentStatus,
                        storyAgentConnecting,
                        storyAgentProjects,
                        storyAgentLoadingProjects,
                        importingProject,
                        importResults,
                        // 计算属性
                        statusClass,
                        totalTools,
                        enabledTools,
                        disabledTools,
                        // 方法
                        switchTab,
                        toggleServer,
                        saveSettings,
                        copyUrl,
                        loadToolManagerState,
                        updateToolStatus,
                        selectAllTools,
                        deselectAllTools,
                        saveChanges,
                        toggleCategoryTools,
                        getToolsByCategory,
                        getCategoryDisplayName,
                        loadStoryAgentSettings,
                        saveAndConnectStoryAgent,
                        refreshStoryAgentProjects,
                        importStoryAgentProject
                    };
                },
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/vue/mcp-server-app.html'), 'utf-8'),
            }));
            app.mount(this.$.app);
            panelDataMap.set(this, app);
            console.log('[MCP Panel] Vue3 app mounted successfully');
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtDQUErQzs7QUFFL0MsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUM1Qiw2QkFBaUc7QUFFakcsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVksQ0FBQztBQTRCN0MsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFBQWE7S0FDNUI7SUFDRCxLQUFLO1FBQ0QsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2IsTUFBTSxHQUFHLEdBQUcsSUFBQSxlQUFTLEVBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTVFLFVBQVU7WUFDVixHQUFHLENBQUMsU0FBUyxDQUFDLGNB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Q0FBQyxDQUFDO1lBQ3RCLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRTVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLENBQUMsQ0FBQztRQUM3RCxDQUFDO0lBQ0wsQ0FBQztJQUNELFdBQVcsS0FBSyxDQUFDO0lBQ2pCLEtBQUs7UUFDRCxNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLElBQUksR0FBRyxFQUFFLENBQUM7WUFDTixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEIsQ0FBQztJQUNMLENBQUM7Q0FDSixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSB2dWUvb25lLWNvbXBvbmVudC1wZXItZmlsZSAqL1xyXG5cclxuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xyXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGNyZWF0ZUFwcCwgQXBwLCBkZWZpbmVDb21wb25lbnQsIHJlZiwgY29tcHV0ZWQsIG9uTW91bnRlZCwgd2F0Y2gsIG5leHRUaWNrIH0gZnJvbSAndnVlJztcclxuXHJcbmNvbnN0IHBhbmVsRGF0YU1hcCA9IG5ldyBXZWFrTWFwPGFueSwgQXBwPigpO1xyXG5cclxuLy8g5a6a5LmJ5bel5YW36YWN572u5o6l5Y+jXHJcbmludGVyZmFjZSBUb29sQ29uZmlnIHtcclxuICAgIGNhdGVnb3J5OiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBlbmFibGVkOiBib29sZWFuO1xyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcclxufVxyXG5cclxuLy8g5a6a5LmJ6YWN572u5o6l5Y+jXHJcbmludGVyZmFjZSBDb25maWd1cmF0aW9uIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG4gICAgdG9vbHM6IFRvb2xDb25maWdbXTtcclxuICAgIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gICAgdXBkYXRlZEF0OiBzdHJpbmc7XHJcbn1cclxuXHJcbi8vIOWumuS5ieacjeWKoeWZqOiuvue9ruaOpeWPo1xyXG5pbnRlcmZhY2UgU2VydmVyU2V0dGluZ3Mge1xyXG4gICAgcG9ydDogbnVtYmVyO1xyXG4gICAgYXV0b1N0YXJ0OiBib29sZWFuO1xyXG4gICAgZGVidWdMb2c6IGJvb2xlYW47XHJcbiAgICBtYXhDb25uZWN0aW9uczogbnVtYmVyO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xyXG4gICAgbGlzdGVuZXJzOiB7XHJcbiAgICAgICAgc2hvdygpIHsgXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBQYW5lbCBzaG93bicpOyBcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZGUoKSB7IFxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgaGlkZGVuJyk7IFxyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgdGVtcGxhdGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS9kZWZhdWx0L2luZGV4Lmh0bWwnKSwgJ3V0Zi04JyksXHJcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxyXG4gICAgJDoge1xyXG4gICAgICAgIGFwcDogJyNhcHAnLFxyXG4gICAgICAgIHBhbmVsVGl0bGU6ICcjcGFuZWxUaXRsZScsXHJcbiAgICB9LFxyXG4gICAgcmVhZHkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuJC5hcHApIHtcclxuICAgICAgICAgICAgY29uc3QgYXBwID0gY3JlYXRlQXBwKHt9KTtcclxuICAgICAgICAgICAgYXBwLmNvbmZpZy5jb21waWxlck9wdGlvbnMuaXNDdXN0b21FbGVtZW50ID0gKHRhZykgPT4gdGFnLnN0YXJ0c1dpdGgoJ3VpLScpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g5Yib5bu65Li75bqU55So57uE5Lu2XHJcbiAgICAgICAgICAgIGFwcC5jb21wb25lbnQoJ01jcFNlcnZlckFwcCcsIGRlZmluZUNvbXBvbmVudCh7XHJcbiAgICAgICAgICAgICAgICBzZXR1cCgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDlk43lupTlvI/mlbDmja5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVUYWIgPSByZWYoJ3NlcnZlcicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZlclJ1bm5pbmcgPSByZWYoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZlclN0YXR1cyA9IHJlZign5bey5YGc5q2iJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29ubmVjdGVkQ2xpZW50cyA9IHJlZigwKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBodHRwVXJsID0gcmVmKCcnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1Byb2Nlc3NpbmcgPSByZWYoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gcmVmPFNlcnZlclNldHRpbmdzPih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IDEwXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3J5QWdlbnQg5o6l5YWl6YWN572uXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RvcnlBZ2VudCA9IHJlZih7IGJhc2VVcmw6ICcnLCB1c2VybmFtZTogJycsIHBhc3N3b3JkOiAnJyB9KTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG9yeUFnZW50U3RhdHVzID0gcmVmKCfmnKrov57mjqUnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG9yeUFnZW50Q29ubmVjdGluZyA9IHJlZihmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RvcnlBZ2VudFByb2plY3RzID0gcmVmPGFueVtdPihbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RvcnlBZ2VudExvYWRpbmdQcm9qZWN0cyA9IHJlZihmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0aW5nUHJvamVjdCA9IHJlZignJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0UmVzdWx0cyA9IHJlZjxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+Pih7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlVG9vbHMgPSByZWY8VG9vbENvbmZpZ1tdPihbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9vbENhdGVnb3JpZXMgPSByZWY8c3RyaW5nW10+KFtdKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6K6h566X5bGe5oCnXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzQ2xhc3MgPSBjb21wdXRlZCgoKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3RhdHVzLXJ1bm5pbmcnOiBzZXJ2ZXJSdW5uaW5nLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3RhdHVzLXN0b3BwZWQnOiAhc2VydmVyUnVubmluZy52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFRvb2xzID0gY29tcHV0ZWQoKCkgPT4gYXZhaWxhYmxlVG9vbHMudmFsdWUubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmFibGVkVG9vbHMgPSBjb21wdXRlZCgoKSA9PiBhdmFpbGFibGVUb29scy52YWx1ZS5maWx0ZXIodCA9PiB0LmVuYWJsZWQpLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzYWJsZWRUb29scyA9IGNvbXB1dGVkKCgpID0+IHRvdGFsVG9vbHMudmFsdWUgLSBlbmFibGVkVG9vbHMudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXR0aW5nc0NoYW5nZWQgPSByZWYoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOaWueazlVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN3aXRjaFRhYiA9ICh0YWJOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlVGFiLnZhbHVlID0gdGFiTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhYk5hbWUgPT09ICd0b29scycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRUb29sTWFuYWdlclN0YXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvZ2dsZVNlcnZlciA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXJ2ZXJSdW5uaW5nLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdG9wLXNlcnZlcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlkK/liqjmnI3liqHlmajml7bkvb/nlKjlvZPliY3pnaLmnb/orr7nva5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IHNldHRpbmdzLnZhbHVlLnBvcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogc2V0dGluZ3MudmFsdWUuYXV0b1N0YXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEZWJ1Z0xvZzogc2V0dGluZ3MudmFsdWUuZGVidWdMb2csXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiBzZXR0aW5ncy52YWx1ZS5tYXhDb25uZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBjdXJyZW50U2V0dGluZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RhcnQtc2VydmVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFNlcnZlciB0b2dnbGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHRvZ2dsZSBzZXJ2ZXI6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzYXZlU2V0dGluZ3MgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliJvlu7rkuIDkuKrnroDljZXnmoTlr7nosaHvvIzpgb/lhY3lhYvpmobplJnor69cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBzZXR0aW5ncy52YWx1ZS5wb3J0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogc2V0dGluZ3MudmFsdWUuYXV0b1N0YXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nOiBzZXR0aW5ncy52YWx1ZS5kZWJ1Z0xvZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogc2V0dGluZ3MudmFsdWUubWF4Q29ubmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXNldHRpbmdzJywgc2V0dGluZ3NEYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVnVlIEFwcF0gU2F2ZSBzZXR0aW5ncyByZXN1bHQ6JywgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzQ2hhbmdlZC52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBzYXZlIHNldHRpbmdzOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29weVVybCA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGh0dHBVcmwudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBVUkwgY29waWVkIHRvIGNsaXBib2FyZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBjb3B5IFVSTDonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWRUb29sTWFuYWdlclN0YXRlID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXRUb29sTWFuYWdlclN0YXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5oC75piv5Yqg6L295ZCO56uv54q25oCB77yM56Gu5L+d5pWw5o2u5piv5pyA5paw55qEXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUgPSByZXN1bHQuYXZhaWxhYmxlVG9vbHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBMb2FkZWQgdG9vbHM6JywgYXZhaWxhYmxlVG9vbHMudmFsdWUubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmm7TmlrDlt6XlhbfliIbnsbtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yaWVzID0gbmV3IFNldChhdmFpbGFibGVUb29scy52YWx1ZS5tYXAodG9vbCA9PiB0b29sLmNhdGVnb3J5KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbENhdGVnb3JpZXMudmFsdWUgPSBBcnJheS5mcm9tKGNhdGVnb3JpZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBsb2FkIHRvb2wgbWFuYWdlciBzdGF0ZTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVRvb2xTdGF0dXMgPSBhc3luYyAoY2F0ZWdvcnk6IHN0cmluZywgbmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIHVwZGF0ZVRvb2xTdGF0dXMgY2FsbGVkOicsIGNhdGVnb3J5LCBuYW1lLCBlbmFibGVkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5YWI5pu05paw5pys5Zyw54q25oCBXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0b29sSW5kZXggPSBhdmFpbGFibGVUb29scy52YWx1ZS5maW5kSW5kZXgodCA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSAmJiB0Lm5hbWUgPT09IG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvb2xJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZVt0b29sSW5kZXhdLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW8uuWItuinpuWPkeWTjeW6lOW8j+abtOaWsFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlID0gWy4uLmF2YWlsYWJsZVRvb2xzLnZhbHVlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIExvY2FsIHN0YXRlIHVwZGF0ZWQsIHRvb2wgZW5hYmxlZDonLCBhdmFpbGFibGVUb29scy52YWx1ZVt0b29sSW5kZXhdLmVuYWJsZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDosIPnlKjlkI7nq6/mm7TmlrBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1cycsIGNhdGVnb3J5LCBuYW1lLCBlbmFibGVkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOWQjuerr+abtOaWsOWksei0pe+8jOWbnua7muacrOWcsOeKtuaAgVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b29sSW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlW3Rvb2xJbmRleF0uZW5hYmxlZCA9ICFlbmFibGVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZSA9IFsuLi5hdmFpbGFibGVUb29scy52YWx1ZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWdWUgQXBwXSBCYWNrZW5kIHVwZGF0ZSBmYWlsZWQsIHJvbGxlZCBiYWNrIGxvY2FsIHN0YXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVnVlIEFwcF0gQmFja2VuZCB1cGRhdGUgc3VjY2Vzc2Z1bCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5Y+R55Sf6ZSZ6K+v77yM5Zue5rua5pys5Zyw54q25oCBXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0b29sSW5kZXggPSBhdmFpbGFibGVUb29scy52YWx1ZS5maW5kSW5kZXgodCA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSAmJiB0Lm5hbWUgPT09IG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvb2xJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZVt0b29sSW5kZXhdLmVuYWJsZWQgPSAhZW5hYmxlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZSA9IFsuLi5hdmFpbGFibGVUb29scy52YWx1ZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHVwZGF0ZSB0b29sIHN0YXR1czonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdEFsbFRvb2xzID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g55u05o6l5pu05paw5pys5Zyw54q25oCB77yM54S25ZCO5L+d5a2YXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29scy52YWx1ZS5mb3JFYWNoKHRvb2wgPT4gdG9vbC5lbmFibGVkID0gdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzYXZlQ2hhbmdlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBzZWxlY3QgYWxsIHRvb2xzOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzZWxlY3RBbGxUb29scyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOebtOaOpeabtOaWsOacrOWcsOeKtuaAge+8jOeEtuWQjuS/neWtmFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMudmFsdWUuZm9yRWFjaCh0b29sID0+IHRvb2wuZW5hYmxlZCA9IGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNhdmVDaGFuZ2VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIGRlc2VsZWN0IGFsbCB0b29sczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2F2ZUNoYW5nZXMgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliJvlu7rmma7pgJrlr7nosaHvvIzpgb/lhY1WdWUz5ZON5bqU5byP5a+56LGh5YWL6ZqG6ZSZ6K+vXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gYXZhaWxhYmxlVG9vbHMudmFsdWUubWFwKHRvb2wgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogU3RyaW5nKHRvb2wuY2F0ZWdvcnkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFN0cmluZyh0b29sLm5hbWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IEJvb2xlYW4odG9vbC5lbmFibGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFNlbmRpbmcgdXBkYXRlczonLCB1cGRhdGVzLmxlbmd0aCwgJ3Rvb2xzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1c0JhdGNoJywgdXBkYXRlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFRvb2wgY2hhbmdlcyBzYXZlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWdWUgQXBwXSBGYWlsZWQgdG8gc2F2ZSB0b29sIGNoYW5nZXM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9nZ2xlQ2F0ZWdvcnlUb29scyA9IGFzeW5jIChjYXRlZ29yeTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDnm7TmjqXmm7TmlrDmnKzlnLDnirbmgIHvvIznhLblkI7kv53lrZhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVRvb2xzLnZhbHVlLmZvckVhY2godG9vbCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvb2wuY2F0ZWdvcnkgPT09IGNhdGVnb3J5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9IGVuYWJsZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzYXZlQ2hhbmdlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnkgdG9vbHM6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBnZXRUb29sc0J5Q2F0ZWdvcnkgPSAoY2F0ZWdvcnk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXZhaWxhYmxlVG9vbHMudmFsdWUuZmlsdGVyKHRvb2wgPT4gdG9vbC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOKUgOKUgCBTdG9yeUFnZW50IOaOpeWFpSDilIDilIBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkU3RvcnlBZ2VudFNldHRpbmdzID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXRTdG9yeUFnZW50U2V0dGluZ3MnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MgJiYgcmVzdWx0LnN0b3J5QWdlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yeUFnZW50LnZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlVXJsOiByZXN1bHQuc3RvcnlBZ2VudC5iYXNlVXJsIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogcmVzdWx0LnN0b3J5QWdlbnQudXNlcm5hbWUgfHwgJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByZXN1bHQuc3RvcnlBZ2VudC5wYXNzd29yZCB8fCAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc3RvcnlBZ2VudC50b2tlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yeUFnZW50U3RhdHVzLnZhbHVlID0gYOW3sui/nuaOpe+8iCR7cmVzdWx0LnN0b3J5QWdlbnQudXNlcm5hbWUgfHwgJ+acquefpeeUqOaItyd977yJYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIGxvYWQgc3RvcnlhZ2VudCBzZXR0aW5nczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzYXZlQW5kQ29ubmVjdFN0b3J5QWdlbnQgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRDb25uZWN0aW5nLnZhbHVlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNmZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlVXJsOiBzdG9yeUFnZW50LnZhbHVlLmJhc2VVcmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHN0b3J5QWdlbnQudmFsdWUudXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHN0b3J5QWdlbnQudmFsdWUucGFzc3dvcmQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGVTdG9yeUFnZW50U2V0dGluZ3MnLCBjZmcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdG9yeUFnZW50Q29ubmVjdCcsIHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yeUFnZW50U3RhdHVzLnZhbHVlID0gYOW3sui/nuaOpe+8iCR7cmVzdWx0LmRhdGE/LnVzZXI/LnVzZXJuYW1lIHx8IHN0b3J5QWdlbnQudmFsdWUudXNlcm5hbWV977yJYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFN0b3J5QWdlbnQgY29ubmVjdGVkOicsIHJlc3VsdC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCByZWZyZXNoU3RvcnlBZ2VudFByb2plY3RzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRTdGF0dXMudmFsdWUgPSBg6L+e5o6l5aSx6LSl77yaJHtyZXN1bHQ/LmVycm9yIHx8ICfmnKrnn6XplJnor68nfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRTdGF0dXMudmFsdWUgPSBg6L+e5o6l5aSx6LSl77yaJHtlcnJvci5tZXNzYWdlIHx8IGVycm9yfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yeUFnZW50Q29ubmVjdGluZy52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5Yi35paw6aG555uu5YiX6KGoXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVmcmVzaFN0b3J5QWdlbnRQcm9qZWN0cyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcnlBZ2VudExvYWRpbmdQcm9qZWN0cy52YWx1ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3N0b3J5QWdlbnRMaXN0UHJvamVjdHMnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yeUFnZW50UHJvamVjdHMudmFsdWUgPSByZXN1bHQuZGF0YT8ucHJvamVjdHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRQcm9qZWN0cy52YWx1ZSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQ/LmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRTdGF0dXMudmFsdWUgPSBg6I635Y+W6aG555uu5aSx6LSl77yaJHtyZXN1bHQuZXJyb3J9YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRQcm9qZWN0cy52YWx1ZSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcnlBZ2VudFN0YXR1cy52YWx1ZSA9IGDojrflj5bpobnnm67lpLHotKXvvJoke2Vycm9yLm1lc3NhZ2UgfHwgZXJyb3J9YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRMb2FkaW5nUHJvamVjdHMudmFsdWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWvvOWFpeaMh+WumumhueebrlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltcG9ydFN0b3J5QWdlbnRQcm9qZWN0ID0gYXN5bmMgKHByb2plY3RJZDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydGluZ1Byb2plY3QudmFsdWUgPSBwcm9qZWN0SWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFJlc3VsdHMudmFsdWUgPSB7IC4uLmltcG9ydFJlc3VsdHMudmFsdWUsIFtwcm9qZWN0SWRdOiAn5a+85YWl5Lit4oCmJyB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdG9yeUFnZW50SW1wb3J0UHJvamVjdCcsIHsgcHJvamVjdElkIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSByZXN1bHQuZGF0YSB8fCB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZXMgPSBkYXRhLmltcG9ydGVkU2NlbmVzPy5sZW5ndGggPz8gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldHMgPSBkYXRhLmltcG9ydGVkQXNzZXRzPy5sZW5ndGggPz8gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2Nvc1NjZW5lcyA9IGRhdGEuY3JlYXRlZFNjZW5lcz8ubGVuZ3RoID8/IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZUNvdW50ID0gKGRhdGEuY3JlYXRlZFNjZW5lcyB8fCBbXSkucmVkdWNlKChzdW06IG51bWJlciwgaXRlbTogYW55KSA9PiBzdW0gKyAoaXRlbS5ub2RlQ291bnQgfHwgMCksIDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvbkNvdW50ID0gKGRhdGEuY3JlYXRlZFNjZW5lcyB8fCBbXSkucmVkdWNlKChzdW06IG51bWJlciwgaXRlbTogYW55KSA9PiBzdW0gKyAoaXRlbS5hbmltYXRpb25Db3VudCB8fCAwKSwgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2tpcHBlZCA9IGRhdGEuc2tpcHBlZD8ubGVuZ3RoID8/IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0UmVzdWx0cy52YWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uaW1wb3J0UmVzdWx0cy52YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW3Byb2plY3RJZF06IGDinJQg5a+85YWlICR7c2NlbmVzfSDkuKrlhbPljaHvvIwke2Fzc2V0c30g5Liq6LWE5Lqn77yM55Sf5oiQICR7Y29jb3NTY2VuZXN9IOS4qiBDb2NvcyDlnLrmma8vJHtub2RlQ291bnR9IOS4quiKgueCuS8ke2FuaW1hdGlvbkNvdW50fSDkuKrliqjnlLske3NraXBwZWQgPyBg77yM6Lez6L+HICR7c2tpcHBlZH0g6aG5YCA6ICcnfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0UmVzdWx0cy52YWx1ZSA9IHsgLi4uaW1wb3J0UmVzdWx0cy52YWx1ZSwgW3Byb2plY3RJZF06IGDinJggJHtyZXN1bHQ/LmVycm9yIHx8ICflr7zlhaXlpLHotKUnfWAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0UmVzdWx0cy52YWx1ZSA9IHsgLi4uaW1wb3J0UmVzdWx0cy52YWx1ZSwgW3Byb2plY3RJZF06IGDinJggJHtlcnJvci5tZXNzYWdlIHx8IGVycm9yfWAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydGluZ1Byb2plY3QudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2V0Q2F0ZWdvcnlEaXNwbGF5TmFtZSA9IChjYXRlZ29yeTogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlOYW1lczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzY2VuZSc6ICflnLrmma/lt6XlhbcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25vZGUnOiAn6IqC54K55bel5YW3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjb21wb25lbnQnOiAn57uE5Lu25bel5YW3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdwcmVmYWInOiAn6aKE5Yi25L2T5bel5YW3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdwcm9qZWN0JzogJ+mhueebruW3peWFtycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGVidWcnOiAn6LCD6K+V5bel5YW3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdwcmVmZXJlbmNlcyc6ICflgY/lpb3orr7nva7lt6XlhbcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3NlcnZlcic6ICfmnI3liqHlmajlt6XlhbcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Jyb2FkY2FzdCc6ICflub/mkq3lt6XlhbcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3NjZW5lQWR2YW5jZWQnOiAn6auY57qn5Zy65pmv5bel5YW3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzY2VuZVZpZXcnOiAn5Zy65pmv6KeG5Zu+5bel5YW3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZWZlcmVuY2VJbWFnZSc6ICflj4LogIPlm77niYflt6XlhbcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Fzc2V0QWR2YW5jZWQnOiAn6auY57qn6LWE5rqQ5bel5YW3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWxpZGF0aW9uJzogJ+mqjOivgeW3peWFtydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhdGVnb3J5TmFtZXNbY2F0ZWdvcnldIHx8IGNhdGVnb3J5O1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyDnm5HlkKzorr7nva7lj5jljJZcclxuICAgICAgICAgICAgICAgICAgICB3YXRjaChzZXR0aW5ncywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0NoYW5nZWQudmFsdWUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHsgZGVlcDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g57uE5Lu25oyC6L295pe25Yqg6L295pWw5o2uXHJcbiAgICAgICAgICAgICAgICAgICAgb25Nb3VudGVkKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Yqg6L295bel5YW3566h55CG5Zmo54q25oCBXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGxvYWRUb29sTWFuYWdlclN0YXRlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDliqDovb0gU3RvcnlBZ2VudCDphY3nva5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbG9hZFN0b3J5QWdlbnRTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LuO5pyN5Yqh5Zmo54q25oCB6I635Y+W6K6+572u5L+h5oGvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXJ2ZXJTdGF0dXMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC1zZXJ2ZXItc3RhdHVzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VydmVyU3RhdHVzICYmIHNlcnZlclN0YXR1cy5zZXR0aW5ncykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzLnZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBzZXJ2ZXJTdGF0dXMuc2V0dGluZ3MucG9ydCB8fCAzMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHNlcnZlclN0YXR1cy5zZXR0aW5ncy5hdXRvU3RhcnQgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nOiBzZXJ2ZXJTdGF0dXMuc2V0dGluZ3MuZW5hYmxlRGVidWdMb2cgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiBzZXJ2ZXJTdGF0dXMuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgfHwgMTBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVnVlIEFwcF0gU2VydmVyIHNldHRpbmdzIGxvYWRlZCBmcm9tIHN0YXR1czonLCBzZXJ2ZXJTdGF0dXMuc2V0dGluZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZXJ2ZXJTdGF0dXMgJiYgc2VydmVyU3RhdHVzLnBvcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlhbzlrrnml6fniYjmnKzvvIzlj6rojrflj5bnq6/lj6Pkv6Hmga9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy52YWx1ZS5wb3J0ID0gc2VydmVyU3RhdHVzLnBvcnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBQb3J0IGxvYWRlZCBmcm9tIHNlcnZlciBzdGF0dXM6Jywgc2VydmVyU3RhdHVzLnBvcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBnZXQgc2VydmVyIHN0YXR1czonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIFVzaW5nIGRlZmF1bHQgc2VydmVyIHNldHRpbmdzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWumuacn+abtOaWsOacjeWKoeWZqOeKtuaAgVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZ2V0LXNlcnZlci1zdGF0dXMnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclJ1bm5pbmcudmFsdWUgPSByZXN1bHQucnVubmluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVyU3RhdHVzLnZhbHVlID0gcmVzdWx0LnJ1bm5pbmcgPyAn6L+Q6KGM5LitJyA6ICflt7LlgZzmraInO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0ZWRDbGllbnRzLnZhbHVlID0gcmVzdWx0LmNsaWVudHMgfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaHR0cFVybC52YWx1ZSA9IHJlc3VsdC5ydW5uaW5nID8gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtyZXN1bHQucG9ydH1gIDogJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZy52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBnZXQgc2VydmVyIHN0YXR1czonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaVsOaNrlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVUYWIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclJ1bm5pbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkQ2xpZW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cFVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xDYXRlZ29yaWVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0NoYW5nZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRTdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRDb25uZWN0aW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yeUFnZW50UHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5QWdlbnRMb2FkaW5nUHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydGluZ1Byb2plY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFJlc3VsdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDorqHnrpflsZ7mgKdcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWRUb29scyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWRUb29scyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaWueazlVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2hUYWIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZVNlcnZlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZVNldHRpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkVG9vbE1hbmFnZXJTdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlVG9vbFN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0QWxsVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsVG9vbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVDaGFuZ2VzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVDYXRlZ29yeVRvb2xzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRUb29sc0J5Q2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldENhdGVnb3J5RGlzcGxheU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRTdG9yeUFnZW50U2V0dGluZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVBbmRDb25uZWN0U3RvcnlBZ2VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFN0b3J5QWdlbnRQcm9qZWN0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0U3RvcnlBZ2VudFByb2plY3RcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvdnVlL21jcC1zZXJ2ZXItYXBwLmh0bWwnKSwgJ3V0Zi04JyksXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGFwcC5tb3VudCh0aGlzLiQuYXBwKTtcclxuICAgICAgICAgICAgcGFuZWxEYXRhTWFwLnNldCh0aGlzLCBhcHApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFZ1ZTMgYXBwIG1vdW50ZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGJlZm9yZUNsb3NlKCkgeyB9LFxyXG4gICAgY2xvc2UoKSB7XHJcbiAgICAgICAgY29uc3QgYXBwID0gcGFuZWxEYXRhTWFwLmdldCh0aGlzKTtcclxuICAgICAgICBpZiAoYXBwKSB7XHJcbiAgICAgICAgICAgIGFwcC51bm1vdW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxufSk7Il19