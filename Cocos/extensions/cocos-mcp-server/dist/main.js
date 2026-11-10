"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const mcp_server_1 = require("./mcp-server");
const settings_1 = require("./settings");
const tool_manager_1 = require("./tools/tool-manager");
const storyagent_tools_1 = require("./tools/storyagent-tools");
let mcpServer = null;
let toolManager;
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    /**
     * @en Open the MCP server panel
     * @zh 打开 MCP 服务器面板
     */
    openPanel() {
        Editor.Panel.open('cocos-mcp-server');
    },
    /**
     * @en Start the MCP server
     * @zh 启动 MCP 服务器
     */
    async startServer() {
        if (mcpServer) {
            // 确保使用最新的工具配置
            const enabledTools = toolManager.getEnabledTools();
            mcpServer.updateEnabledTools(enabledTools);
            await mcpServer.start();
        }
        else {
            console.warn('[MCP插件] mcpServer 未初始化');
        }
    },
    /**
     * @en Stop the MCP server
     * @zh 停止 MCP 服务器
     */
    async stopServer() {
        if (mcpServer) {
            mcpServer.stop();
        }
        else {
            console.warn('[MCP插件] mcpServer 未初始化');
        }
    },
    /**
     * @en Get server status
     * @zh 获取服务器状态
     */
    getServerStatus() {
        const status = mcpServer ? mcpServer.getStatus() : { running: false, port: 0, clients: 0 };
        const settings = mcpServer ? mcpServer.getSettings() : (0, settings_1.readSettings)();
        return Object.assign(Object.assign({}, status), { settings: settings });
    },
    /**
     * @en Update server settings
     * @zh 更新服务器设置（与现有配置合并，保留 storyAgent 等未提交字段）
     */
    updateSettings(settings) {
        const current = (0, settings_1.readSettings)();
        const merged = Object.assign(Object.assign({}, current), settings);
        // 面板只提交服务器字段时，不清空 storyAgent 配置
        if (settings.storyAgent === undefined) {
            merged.storyAgent = current.storyAgent;
        }
        (0, settings_1.saveSettings)(merged);
        if (mcpServer) {
            mcpServer.stop();
            mcpServer = new mcp_server_1.MCPServer(merged);
            mcpServer.start();
        }
        else {
            mcpServer = new mcp_server_1.MCPServer(merged);
            mcpServer.start();
        }
    },
    /**
     * @en Get tools list
     * @zh 获取工具列表
     */
    getToolsList() {
        return mcpServer ? mcpServer.getAvailableTools() : [];
    },
    getFilteredToolsList() {
        if (!mcpServer)
            return [];
        // 获取当前启用的工具
        const enabledTools = toolManager.getEnabledTools();
        // 更新MCP服务器的启用工具列表
        mcpServer.updateEnabledTools(enabledTools);
        return mcpServer.getFilteredTools(enabledTools);
    },
    /**
     * @en Get server settings
     * @zh 获取服务器设置
     */
    async getServerSettings() {
        return mcpServer ? mcpServer.getSettings() : (0, settings_1.readSettings)();
    },
    /**
     * @en Get server settings (alternative method)
     * @zh 获取服务器设置（替代方法）
     */
    async getSettings() {
        return mcpServer ? mcpServer.getSettings() : (0, settings_1.readSettings)();
    },
    // 工具管理器相关方法
    async getToolManagerState() {
        return toolManager.getToolManagerState();
    },
    async createToolConfiguration(name, description) {
        try {
            const config = toolManager.createConfiguration(name, description);
            return { success: true, id: config.id, config };
        }
        catch (error) {
            throw new Error(`创建配置失败: ${error.message}`);
        }
    },
    async updateToolConfiguration(configId, updates) {
        try {
            return toolManager.updateConfiguration(configId, updates);
        }
        catch (error) {
            throw new Error(`更新配置失败: ${error.message}`);
        }
    },
    async deleteToolConfiguration(configId) {
        try {
            toolManager.deleteConfiguration(configId);
            return { success: true };
        }
        catch (error) {
            throw new Error(`删除配置失败: ${error.message}`);
        }
    },
    async setCurrentToolConfiguration(configId) {
        try {
            toolManager.setCurrentConfiguration(configId);
            return { success: true };
        }
        catch (error) {
            throw new Error(`设置当前配置失败: ${error.message}`);
        }
    },
    async updateToolStatus(category, toolName, enabled) {
        try {
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }
            toolManager.updateToolStatus(currentConfig.id, category, toolName, enabled);
            // 更新MCP服务器的工具列表
            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }
            return { success: true };
        }
        catch (error) {
            throw new Error(`更新工具状态失败: ${error.message}`);
        }
    },
    async updateToolStatusBatch(updates) {
        try {
            console.log(`[Main] updateToolStatusBatch called with updates count:`, updates ? updates.length : 0);
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }
            toolManager.updateToolStatusBatch(currentConfig.id, updates);
            // 更新MCP服务器的工具列表
            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }
            return { success: true };
        }
        catch (error) {
            throw new Error(`批量更新工具状态失败: ${error.message}`);
        }
    },
    async exportToolConfiguration(configId) {
        try {
            return { configJson: toolManager.exportConfiguration(configId) };
        }
        catch (error) {
            throw new Error(`导出配置失败: ${error.message}`);
        }
    },
    async importToolConfiguration(configJson) {
        try {
            return toolManager.importConfiguration(configJson);
        }
        catch (error) {
            throw new Error(`导入配置失败: ${error.message}`);
        }
    },
    async getEnabledTools() {
        return toolManager.getEnabledTools();
    },
    // StoryAgent 配置读写
    async getStoryAgentSettings() {
        const settings = (0, settings_1.readSettings)();
        return { success: true, storyAgent: settings.storyAgent };
    },
    async updateStoryAgentSettings(storyAgent) {
        var _a;
        const settings = (0, settings_1.readSettings)();
        settings.storyAgent = Object.assign(Object.assign({}, ((_a = settings.storyAgent) !== null && _a !== void 0 ? _a : {})), (storyAgent !== null && storyAgent !== void 0 ? storyAgent : {}));
        (0, settings_1.saveSettings)(settings);
        return { success: true, storyAgent: settings.storyAgent };
    },
    /**
     * @en Test StoryAgent connection (login with saved credentials)
     * @zh 用已保存的账号密码连接 StoryAgent，成功则缓存 token
     */
    async storyAgentConnect(args) {
        try {
            const tools = new storyagent_tools_1.StoryAgentTools();
            return await tools.execute('connect', args !== null && args !== void 0 ? args : {});
        }
        catch (error) {
            return { success: false, error: error.message || String(error) };
        }
    },
    /**
     * @en List StoryAgent projects
     * @zh 列出 StoryAgent 项目（面板刷新项目列表用）
     */
    async storyAgentListProjects() {
        try {
            const tools = new storyagent_tools_1.StoryAgentTools();
            return await tools.execute('list_projects', {});
        }
        catch (error) {
            return { success: false, error: error.message || String(error) };
        }
    },
    /**
     * @en Import a StoryAgent project into Cocos
     * @zh 导入指定 StoryAgent 项目（图数据 + 资产）到 Cocos 工程
     */
    async storyAgentImportProject(args) {
        try {
            const tools = new storyagent_tools_1.StoryAgentTools();
            return await tools.execute('import_project', args !== null && args !== void 0 ? args : {});
        }
        catch (error) {
            return { success: false, error: error.message || String(error) };
        }
    }
};
/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
function load() {
    console.log('Cocos MCP Server extension loaded');
    // 初始化工具管理器
    toolManager = new tool_manager_1.ToolManager();
    // 读取设置
    const settings = (0, settings_1.readSettings)();
    mcpServer = new mcp_server_1.MCPServer(settings);
    // 初始化MCP服务器的工具列表
    const enabledTools = toolManager.getEnabledTools();
    mcpServer.updateEnabledTools(enabledTools);
    // 如果设置了自动启动，则启动服务器
    if (settings.autoStart) {
        mcpServer.start().catch(err => {
            console.error('Failed to auto-start MCP server:', err);
        });
    }
}
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
function unload() {
    if (mcpServer) {
        mcpServer.stop();
        mcpServer = null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTBSQSxvQkFvQkM7QUFNRCx3QkFLQztBQXpURCw2Q0FBeUM7QUFDekMseUNBQXdEO0FBRXhELHVEQUFtRDtBQUNuRCwrREFBMkQ7QUFFM0QsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQztBQUN2QyxJQUFJLFdBQXdCLENBQUM7QUFFN0I7OztHQUdHO0FBQ1UsUUFBQSxPQUFPLEdBQTRDO0lBQzVEOzs7T0FHRztJQUNILFNBQVM7UUFDTCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFJRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsV0FBVztRQUNiLElBQUksU0FBUyxFQUFFLENBQUM7WUFDWixjQUFjO1lBQ2QsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ25ELFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzQyxNQUFNLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM1QixDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxVQUFVO1FBQ1osSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNyQixDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNILGVBQWU7UUFDWCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFB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QUFFLENBQUM7UUFDakIsU0FBUyxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1DUFNlcnZlciB9IGZyb20gJy4vbWNwLXNlcnZlcic7XHJcbmltcG9ydCB7IHJlYWRTZXR0aW5ncywgc2F2ZVNldHRpbmdzIH0gZnJvbSAnLi9zZXR0aW5ncyc7XHJcbmltcG9ydCB7IE1DUFNlcnZlclNldHRpbmdzIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IFRvb2xNYW5hZ2VyIH0gZnJvbSAnLi90b29scy90b29sLW1hbmFnZXInO1xyXG5pbXBvcnQgeyBTdG9yeUFnZW50VG9vbHMgfSBmcm9tICcuL3Rvb2xzL3N0b3J5YWdlbnQtdG9vbHMnO1xyXG5cclxubGV0IG1jcFNlcnZlcjogTUNQU2VydmVyIHwgbnVsbCA9IG51bGw7XHJcbmxldCB0b29sTWFuYWdlcjogVG9vbE1hbmFnZXI7XHJcblxyXG4vKipcclxuICogQGVuIFJlZ2lzdHJhdGlvbiBtZXRob2QgZm9yIHRoZSBtYWluIHByb2Nlc3Mgb2YgRXh0ZW5zaW9uXHJcbiAqIEB6aCDkuLrmianlsZXnmoTkuLvov5vnqIvnmoTms6jlhozmlrnms5VcclxuICovXHJcbmV4cG9ydCBjb25zdCBtZXRob2RzOiB7IFtrZXk6IHN0cmluZ106ICguLi5hbnk6IGFueSkgPT4gYW55IH0gPSB7XHJcbiAgICAvKipcclxuICAgICAqIEBlbiBPcGVuIHRoZSBNQ1Agc2VydmVyIHBhbmVsXHJcbiAgICAgKiBAemgg5omT5byAIE1DUCDmnI3liqHlmajpnaLmnb9cclxuICAgICAqL1xyXG4gICAgb3BlblBhbmVsKCkge1xyXG4gICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKCdjb2Nvcy1tY3Atc2VydmVyJyk7XHJcbiAgICB9LFxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAZW4gU3RhcnQgdGhlIE1DUCBzZXJ2ZXJcclxuICAgICAqIEB6aCDlkK/liqggTUNQIOacjeWKoeWZqFxyXG4gICAgICovXHJcbiAgICBhc3luYyBzdGFydFNlcnZlcigpIHtcclxuICAgICAgICBpZiAobWNwU2VydmVyKSB7XHJcbiAgICAgICAgICAgIC8vIOehruS/neS9v+eUqOacgOaWsOeahOW3peWFt+mFjee9rlxyXG4gICAgICAgICAgICBjb25zdCBlbmFibGVkVG9vbHMgPSB0b29sTWFuYWdlci5nZXRFbmFibGVkVG9vbHMoKTtcclxuICAgICAgICAgICAgbWNwU2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xyXG4gICAgICAgICAgICBhd2FpdCBtY3BTZXJ2ZXIuc3RhcnQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tNQ1Dmj5Lku7ZdIG1jcFNlcnZlciDmnKrliJ3lp4vljJYnKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGVuIFN0b3AgdGhlIE1DUCBzZXJ2ZXJcclxuICAgICAqIEB6aCDlgZzmraIgTUNQIOacjeWKoeWZqFxyXG4gICAgICovXHJcbiAgICBhc3luYyBzdG9wU2VydmVyKCkge1xyXG4gICAgICAgIGlmIChtY3BTZXJ2ZXIpIHtcclxuICAgICAgICAgICAgbWNwU2VydmVyLnN0b3AoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tNQ1Dmj5Lku7ZdIG1jcFNlcnZlciDmnKrliJ3lp4vljJYnKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGVuIEdldCBzZXJ2ZXIgc3RhdHVzXHJcbiAgICAgKiBAemgg6I635Y+W5pyN5Yqh5Zmo54q25oCBXHJcbiAgICAgKi9cclxuICAgIGdldFNlcnZlclN0YXR1cygpIHtcclxuICAgICAgICBjb25zdCBzdGF0dXMgPSBtY3BTZXJ2ZXIgPyBtY3BTZXJ2ZXIuZ2V0U3RhdHVzKCkgOiB7IHJ1bm5pbmc6IGZhbHNlLCBwb3J0OiAwLCBjbGllbnRzOiAwIH07XHJcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBtY3BTZXJ2ZXIgPyBtY3BTZXJ2ZXIuZ2V0U2V0dGluZ3MoKSA6IHJlYWRTZXR0aW5ncygpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnN0YXR1cyxcclxuICAgICAgICAgICAgc2V0dGluZ3M6IHNldHRpbmdzXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAZW4gVXBkYXRlIHNlcnZlciBzZXR0aW5nc1xyXG4gICAgICogQHpoIOabtOaWsOacjeWKoeWZqOiuvue9ru+8iOS4jueOsOaciemFjee9ruWQiOW5tu+8jOS/neeVmSBzdG9yeUFnZW50IOetieacquaPkOS6pOWtl+aute+8iVxyXG4gICAgICovXHJcbiAgICB1cGRhdGVTZXR0aW5ncyhzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3MpIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gcmVhZFNldHRpbmdzKCk7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VkOiBNQ1BTZXJ2ZXJTZXR0aW5ncyA9IHsgLi4uY3VycmVudCwgLi4uc2V0dGluZ3MgfTtcclxuICAgICAgICAvLyDpnaLmnb/lj6rmj5DkuqTmnI3liqHlmajlrZfmrrXml7bvvIzkuI3muIXnqbogc3RvcnlBZ2VudCDphY3nva5cclxuICAgICAgICBpZiAoc2V0dGluZ3Muc3RvcnlBZ2VudCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1lcmdlZC5zdG9yeUFnZW50ID0gY3VycmVudC5zdG9yeUFnZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICBzYXZlU2V0dGluZ3MobWVyZ2VkKTtcclxuICAgICAgICBpZiAobWNwU2VydmVyKSB7XHJcbiAgICAgICAgICAgIG1jcFNlcnZlci5zdG9wKCk7XHJcbiAgICAgICAgICAgIG1jcFNlcnZlciA9IG5ldyBNQ1BTZXJ2ZXIobWVyZ2VkKTtcclxuICAgICAgICAgICAgbWNwU2VydmVyLnN0YXJ0KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbWNwU2VydmVyID0gbmV3IE1DUFNlcnZlcihtZXJnZWQpO1xyXG4gICAgICAgICAgICBtY3BTZXJ2ZXIuc3RhcnQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGVuIEdldCB0b29scyBsaXN0XHJcbiAgICAgKiBAemgg6I635Y+W5bel5YW35YiX6KGoXHJcbiAgICAgKi9cclxuICAgIGdldFRvb2xzTGlzdCgpIHtcclxuICAgICAgICByZXR1cm4gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldEF2YWlsYWJsZVRvb2xzKCkgOiBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RmlsdGVyZWRUb29sc0xpc3QoKSB7XHJcbiAgICAgICAgaWYgKCFtY3BTZXJ2ZXIpIHJldHVybiBbXTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDojrflj5blvZPliY3lkK/nlKjnmoTlt6XlhbdcclxuICAgICAgICBjb25zdCBlbmFibGVkVG9vbHMgPSB0b29sTWFuYWdlci5nZXRFbmFibGVkVG9vbHMoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDmm7TmlrBNQ1DmnI3liqHlmajnmoTlkK/nlKjlt6XlhbfliJfooahcclxuICAgICAgICBtY3BTZXJ2ZXIudXBkYXRlRW5hYmxlZFRvb2xzKGVuYWJsZWRUb29scyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1jcFNlcnZlci5nZXRGaWx0ZXJlZFRvb2xzKGVuYWJsZWRUb29scyk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBAZW4gR2V0IHNlcnZlciBzZXR0aW5nc1xyXG4gICAgICogQHpoIOiOt+WPluacjeWKoeWZqOiuvue9rlxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRTZXJ2ZXJTZXR0aW5ncygpIHtcclxuICAgICAgICByZXR1cm4gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldFNldHRpbmdzKCkgOiByZWFkU2V0dGluZ3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAZW4gR2V0IHNlcnZlciBzZXR0aW5ncyAoYWx0ZXJuYXRpdmUgbWV0aG9kKVxyXG4gICAgICogQHpoIOiOt+WPluacjeWKoeWZqOiuvue9ru+8iOabv+S7o+aWueazle+8iVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRTZXR0aW5ncygpIHtcclxuICAgICAgICByZXR1cm4gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldFNldHRpbmdzKCkgOiByZWFkU2V0dGluZ3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8g5bel5YW3566h55CG5Zmo55u45YWz5pa55rOVXHJcbiAgICBhc3luYyBnZXRUb29sTWFuYWdlclN0YXRlKCkge1xyXG4gICAgICAgIHJldHVybiB0b29sTWFuYWdlci5nZXRUb29sTWFuYWdlclN0YXRlKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZVRvb2xDb25maWd1cmF0aW9uKG5hbWU6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSB0b29sTWFuYWdlci5jcmVhdGVDb25maWd1cmF0aW9uKG5hbWUsIGRlc2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgaWQ6IGNvbmZpZy5pZCwgY29uZmlnIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOWIm+W7uumFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYXN5bmMgdXBkYXRlVG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZywgdXBkYXRlczogYW55KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRvb2xNYW5hZ2VyLnVwZGF0ZUNvbmZpZ3VyYXRpb24oY29uZmlnSWQsIHVwZGF0ZXMpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmm7TmlrDphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIGRlbGV0ZVRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0b29sTWFuYWdlci5kZWxldGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDliKDpmaTphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIHNldEN1cnJlbnRUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdG9vbE1hbmFnZXIuc2V0Q3VycmVudENvbmZpZ3VyYXRpb24oY29uZmlnSWQpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOiuvue9ruW9k+WJjemFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRvb2xNYW5hZ2VyLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudENvbmZpZykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmsqHmnInlvZPliY3phY3nva4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdG9vbE1hbmFnZXIudXBkYXRlVG9vbFN0YXR1cyhjdXJyZW50Q29uZmlnLmlkLCBjYXRlZ29yeSwgdG9vbE5hbWUsIGVuYWJsZWQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g5pu05pawTUNQ5pyN5Yqh5Zmo55qE5bel5YW35YiX6KGoXHJcbiAgICAgICAgICAgIGlmIChtY3BTZXJ2ZXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xyXG4gICAgICAgICAgICAgICAgbWNwU2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOabtOaWsOW3peWFt+eKtuaAgeWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1c0JhdGNoKHVwZGF0ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNYWluXSB1cGRhdGVUb29sU3RhdHVzQmF0Y2ggY2FsbGVkIHdpdGggdXBkYXRlcyBjb3VudDpgLCB1cGRhdGVzID8gdXBkYXRlcy5sZW5ndGggOiAwKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDb25maWcgPSB0b29sTWFuYWdlci5nZXRDdXJyZW50Q29uZmlndXJhdGlvbigpO1xyXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDb25maWcpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5rKh5pyJ5b2T5YmN6YWN572uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRvb2xNYW5hZ2VyLnVwZGF0ZVRvb2xTdGF0dXNCYXRjaChjdXJyZW50Q29uZmlnLmlkLCB1cGRhdGVzKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxyXG4gICAgICAgICAgICBpZiAobWNwU2VydmVyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbmFibGVkVG9vbHMgPSB0b29sTWFuYWdlci5nZXRFbmFibGVkVG9vbHMoKTtcclxuICAgICAgICAgICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmibnph4/mm7TmlrDlt6XlhbfnirbmgIHlpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIGV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBjb25maWdKc29uOiB0b29sTWFuYWdlci5leHBvcnRDb25maWd1cmF0aW9uKGNvbmZpZ0lkKSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlr7zlh7rphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIGltcG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0pzb246IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0b29sTWFuYWdlci5pbXBvcnRDb25maWd1cmF0aW9uKGNvbmZpZ0pzb24pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlr7zlhaXphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIGdldEVuYWJsZWRUb29scygpIHtcclxuICAgICAgICByZXR1cm4gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN0b3J5QWdlbnQg6YWN572u6K+75YaZXHJcbiAgICBhc3luYyBnZXRTdG9yeUFnZW50U2V0dGluZ3MoKSB7XHJcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSByZWFkU2V0dGluZ3MoKTtcclxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBzdG9yeUFnZW50OiBzZXR0aW5ncy5zdG9yeUFnZW50IH07XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIHVwZGF0ZVN0b3J5QWdlbnRTZXR0aW5ncyhzdG9yeUFnZW50OiBhbnkpIHtcclxuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IHJlYWRTZXR0aW5ncygpO1xyXG4gICAgICAgIHNldHRpbmdzLnN0b3J5QWdlbnQgPSB7IC4uLihzZXR0aW5ncy5zdG9yeUFnZW50ID8/IHt9KSwgLi4uKHN0b3J5QWdlbnQgPz8ge30pIH07XHJcbiAgICAgICAgc2F2ZVNldHRpbmdzKHNldHRpbmdzKTtcclxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBzdG9yeUFnZW50OiBzZXR0aW5ncy5zdG9yeUFnZW50IH07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGVuIFRlc3QgU3RvcnlBZ2VudCBjb25uZWN0aW9uIChsb2dpbiB3aXRoIHNhdmVkIGNyZWRlbnRpYWxzKVxyXG4gICAgICogQHpoIOeUqOW3suS/neWtmOeahOi0puWPt+Wvhueggei/nuaOpSBTdG9yeUFnZW5077yM5oiQ5Yqf5YiZ57yT5a2YIHRva2VuXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHN0b3J5QWdlbnRDb25uZWN0KGFyZ3M6IGFueSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvb2xzID0gbmV3IFN0b3J5QWdlbnRUb29scygpO1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdG9vbHMuZXhlY3V0ZSgnY29ubmVjdCcsIGFyZ3MgPz8ge30pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIHx8IFN0cmluZyhlcnJvcikgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGVuIExpc3QgU3RvcnlBZ2VudCBwcm9qZWN0c1xyXG4gICAgICogQHpoIOWIl+WHuiBTdG9yeUFnZW50IOmhueebru+8iOmdouadv+WIt+aWsOmhueebruWIl+ihqOeUqO+8iVxyXG4gICAgICovXHJcbiAgICBhc3luYyBzdG9yeUFnZW50TGlzdFByb2plY3RzKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvb2xzID0gbmV3IFN0b3J5QWdlbnRUb29scygpO1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdG9vbHMuZXhlY3V0ZSgnbGlzdF9wcm9qZWN0cycsIHt9KTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBTdHJpbmcoZXJyb3IpIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBlbiBJbXBvcnQgYSBTdG9yeUFnZW50IHByb2plY3QgaW50byBDb2Nvc1xyXG4gICAgICogQHpoIOWvvOWFpeaMh+WumiBTdG9yeUFnZW50IOmhueebru+8iOWbvuaVsOaNriArIOi1hOS6p++8ieWIsCBDb2NvcyDlt6XnqItcclxuICAgICAqL1xyXG4gICAgYXN5bmMgc3RvcnlBZ2VudEltcG9ydFByb2plY3QoYXJnczogYW55KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdG9vbHMgPSBuZXcgU3RvcnlBZ2VudFRvb2xzKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0b29scy5leGVjdXRlKCdpbXBvcnRfcHJvamVjdCcsIGFyZ3MgPz8ge30pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIHx8IFN0cmluZyhlcnJvcikgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQGVuIE1ldGhvZCBUcmlnZ2VyZWQgb24gRXh0ZW5zaW9uIFN0YXJ0dXBcclxuICogQHpoIOaJqeWxleWQr+WKqOaXtuinpuWPkeeahOaWueazlVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICBjb25zb2xlLmxvZygnQ29jb3MgTUNQIFNlcnZlciBleHRlbnNpb24gbG9hZGVkJyk7XHJcbiAgICBcclxuICAgIC8vIOWIneWni+WMluW3peWFt+euoeeQhuWZqFxyXG4gICAgdG9vbE1hbmFnZXIgPSBuZXcgVG9vbE1hbmFnZXIoKTtcclxuICAgIFxyXG4gICAgLy8g6K+75Y+W6K6+572uXHJcbiAgICBjb25zdCBzZXR0aW5ncyA9IHJlYWRTZXR0aW5ncygpO1xyXG4gICAgbWNwU2VydmVyID0gbmV3IE1DUFNlcnZlcihzZXR0aW5ncyk7XHJcbiAgICBcclxuICAgIC8vIOWIneWni+WMlk1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxyXG4gICAgY29uc3QgZW5hYmxlZFRvb2xzID0gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XHJcbiAgICBtY3BTZXJ2ZXIudXBkYXRlRW5hYmxlZFRvb2xzKGVuYWJsZWRUb29scyk7XHJcbiAgICBcclxuICAgIC8vIOWmguaenOiuvue9ruS6huiHquWKqOWQr+WKqO+8jOWImeWQr+WKqOacjeWKoeWZqFxyXG4gICAgaWYgKHNldHRpbmdzLmF1dG9TdGFydCkge1xyXG4gICAgICAgIG1jcFNlcnZlci5zdGFydCgpLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBhdXRvLXN0YXJ0IE1DUCBzZXJ2ZXI6JywgZXJyKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEBlbiBNZXRob2QgdHJpZ2dlcmVkIHdoZW4gdW5pbnN0YWxsaW5nIHRoZSBleHRlbnNpb25cclxuICogQHpoIOWNuOi9veaJqeWxleaXtuinpuWPkeeahOaWueazlVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHtcclxuICAgIGlmIChtY3BTZXJ2ZXIpIHtcclxuICAgICAgICBtY3BTZXJ2ZXIuc3RvcCgpO1xyXG4gICAgICAgIG1jcFNlcnZlciA9IG51bGw7XHJcbiAgICB9XHJcbn0iXX0=