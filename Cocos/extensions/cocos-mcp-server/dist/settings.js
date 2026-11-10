"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TOOL_MANAGER_SETTINGS = exports.DEFAULT_SETTINGS = exports.DEFAULT_STORY_AGENT_SETTINGS = void 0;
exports.readSettings = readSettings;
exports.saveSettings = saveSettings;
exports.readToolManagerSettings = readToolManagerSettings;
exports.saveToolManagerSettings = saveToolManagerSettings;
exports.exportToolConfiguration = exportToolConfiguration;
exports.importToolConfiguration = importToolConfiguration;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_SETTINGS = {
    port: 3000,
    autoStart: false,
    enableDebugLog: false,
    allowedOrigins: ['*'],
    maxConnections: 10
};
exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
/** StoryAgent 默认配置 */
exports.DEFAULT_STORY_AGENT_SETTINGS = {
    baseUrl: 'http://127.0.0.1:3000',
    username: '',
    password: '',
    token: '',
    tokenExpiresAt: null
};
const DEFAULT_TOOL_MANAGER_SETTINGS = {
    configurations: [],
    currentConfigId: '',
    maxConfigSlots: 5
};
exports.DEFAULT_TOOL_MANAGER_SETTINGS = DEFAULT_TOOL_MANAGER_SETTINGS;
function getSettingsPath() {
    return path.join(Editor.Project.path, 'settings', 'mcp-server.json');
}
function getToolManagerSettingsPath() {
    return path.join(Editor.Project.path, 'settings', 'tool-manager.json');
}
function ensureSettingsDir() {
    const settingsDir = path.dirname(getSettingsPath());
    if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
    }
}
function readSettings() {
    var _a;
    try {
        ensureSettingsDir();
        const settingsFile = getSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            const parsed = JSON.parse(content);
            const merged = Object.assign(Object.assign({}, DEFAULT_SETTINGS), parsed);
            // 合并 storyAgent 默认值（用户未配置字段补默认）
            merged.storyAgent = Object.assign(Object.assign({}, exports.DEFAULT_STORY_AGENT_SETTINGS), ((_a = parsed.storyAgent) !== null && _a !== void 0 ? _a : {}));
            return merged;
        }
    }
    catch (e) {
        console.error('Failed to read settings:', e);
    }
    return Object.assign(Object.assign({}, DEFAULT_SETTINGS), { storyAgent: Object.assign({}, exports.DEFAULT_STORY_AGENT_SETTINGS) });
}
function saveSettings(settings) {
    try {
        ensureSettingsDir();
        const settingsFile = getSettingsPath();
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    }
    catch (e) {
        console.error('Failed to save settings:', e);
        throw e;
    }
}
// 工具管理器设置相关函数
function readToolManagerSettings() {
    try {
        ensureSettingsDir();
        const settingsFile = getToolManagerSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            return Object.assign(Object.assign({}, DEFAULT_TOOL_MANAGER_SETTINGS), JSON.parse(content));
        }
    }
    catch (e) {
        console.error('Failed to read tool manager settings:', e);
    }
    return DEFAULT_TOOL_MANAGER_SETTINGS;
}
function saveToolManagerSettings(settings) {
    try {
        ensureSettingsDir();
        const settingsFile = getToolManagerSettingsPath();
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    }
    catch (e) {
        console.error('Failed to save tool manager settings:', e);
        throw e;
    }
}
function exportToolConfiguration(config) {
    return JSON.stringify(config, null, 2);
}
function importToolConfiguration(configJson) {
    try {
        const config = JSON.parse(configJson);
        // 验证配置格式
        if (!config.id || !config.name || !Array.isArray(config.tools)) {
            throw new Error('Invalid configuration format');
        }
        return config;
    }
    catch (e) {
        console.error('Failed to parse tool configuration:', e);
        throw new Error('Invalid JSON format or configuration structure');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMENBLG9DQWdCQztBQUVELG9DQVNDO0FBR0QsMERBWUM7QUFFRCwwREFTQztBQUVELDBEQUVDO0FBRUQsMERBWUM7QUFqSEQsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUc3QixNQUFNLGdCQUFnQixHQUFzQjtJQUN4QyxJQUFJLEVBQUUsSUFBSTtJQUNWLFNBQVMsRUFBRSxLQUFLO0lBQ2hCLGNBQWMsRUFBRSxLQUFLO0lBQ3JCLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNyQixjQUFjLEVBQUUsRUFBRTtDQUNyQixDQUFDO0FBeUdPLDRDQUFnQjtBQXZHekIsc0JBQXNCO0FBQ1QsUUFBQSw0QkFBNEIsR0FBdUI7SUFDNUQsT0FBTyxFQUFFLHVCQUF1QjtJQUNoQyxRQUFRLEVBQUUsRUFBRTtJQUNaLFFBQVEsRUFBRSxFQUFFO0lBQ1osS0FBSyxFQUFFLEVBQUU7SUFDVCxjQUFjLEVBQUUsSUFBSTtDQUN2QixDQUFDO0FBRUYsTUFBTSw2QkFBNkIsR0FBd0I7SUFDdkQsY0FBYyxFQUFFLEVBQUU7SUFDbEIsZUFBZSxFQUFFLEVBQUU7SUFDbkIsY0FBYyxFQUFFLENBQUM7Q0FDcEIsQ0FBQztBQTBGeUIsc0VBQTZCO0FBeEZ4RCxTQUFTLGVBQWU7SUFDcEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3pFLENBQUM7QUFFRCxTQUFTLDBCQUEwQjtJQUMvQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDM0UsQ0FBQztBQUVE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LEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsdUNBQXVDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLENBQUM7SUFDWixDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQWdCLHVCQUF1QixDQUFDLE1BQXlCO0lBQzdELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxVQUFrQjtJQUN0RCxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RDLFNBQVM7UUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzdELE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztJQUN0RSxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgTUNQU2VydmVyU2V0dGluZ3MsIFRvb2xNYW5hZ2VyU2V0dGluZ3MsIFRvb2xDb25maWd1cmF0aW9uLCBUb29sQ29uZmlnLCBTdG9yeUFnZW50U2V0dGluZ3MgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE1DUFNlcnZlclNldHRpbmdzID0ge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIGF1dG9TdGFydDogZmFsc2UsXHJcbiAgICBlbmFibGVEZWJ1Z0xvZzogZmFsc2UsXHJcbiAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXHJcbiAgICBtYXhDb25uZWN0aW9uczogMTBcclxufTtcclxuXHJcbi8qKiBTdG9yeUFnZW50IOm7mOiupOmFjee9riAqL1xyXG5leHBvcnQgY29uc3QgREVGQVVMVF9TVE9SWV9BR0VOVF9TRVRUSU5HUzogU3RvcnlBZ2VudFNldHRpbmdzID0ge1xyXG4gICAgYmFzZVVybDogJ2h0dHA6Ly8xMjcuMC4wLjE6MzAwMCcsXHJcbiAgICB1c2VybmFtZTogJycsXHJcbiAgICBwYXNzd29yZDogJycsXHJcbiAgICB0b2tlbjogJycsXHJcbiAgICB0b2tlbkV4cGlyZXNBdDogbnVsbFxyXG59O1xyXG5cclxuY29uc3QgREVGQVVMVF9UT09MX01BTkFHRVJfU0VUVElOR1M6IFRvb2xNYW5hZ2VyU2V0dGluZ3MgPSB7XHJcbiAgICBjb25maWd1cmF0aW9uczogW10sXHJcbiAgICBjdXJyZW50Q29uZmlnSWQ6ICcnLFxyXG4gICAgbWF4Q29uZmlnU2xvdHM6IDVcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldFNldHRpbmdzUGF0aCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnc2V0dGluZ3MnLCAnbWNwLXNlcnZlci5qc29uJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdzZXR0aW5ncycsICd0b29sLW1hbmFnZXIuanNvbicpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlbnN1cmVTZXR0aW5nc0RpcigpOiB2b2lkIHtcclxuICAgIGNvbnN0IHNldHRpbmdzRGlyID0gcGF0aC5kaXJuYW1lKGdldFNldHRpbmdzUGF0aCgpKTtcclxuICAgIGlmICghZnMuZXhpc3RzU3luYyhzZXR0aW5nc0RpcikpIHtcclxuICAgICAgICBmcy5ta2RpclN5bmMoc2V0dGluZ3NEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZFNldHRpbmdzKCk6IE1DUFNlcnZlclNldHRpbmdzIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZW5zdXJlU2V0dGluZ3NEaXIoKTtcclxuICAgICAgICBjb25zdCBzZXR0aW5nc0ZpbGUgPSBnZXRTZXR0aW5nc1BhdGgoKTtcclxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhzZXR0aW5nc0ZpbGUpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2V0dGluZ3NGaWxlLCAndXRmOCcpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBjb25zdCBtZXJnZWQ6IE1DUFNlcnZlclNldHRpbmdzID0geyAuLi5ERUZBVUxUX1NFVFRJTkdTLCAuLi5wYXJzZWQgfTtcclxuICAgICAgICAgICAgLy8g5ZCI5bm2IHN0b3J5QWdlbnQg6buY6K6k5YC877yI55So5oi35pyq6YWN572u5a2X5q616KGl6buY6K6k77yJXHJcbiAgICAgICAgICAgIG1lcmdlZC5zdG9yeUFnZW50ID0geyAuLi5ERUZBVUxUX1NUT1JZX0FHRU5UX1NFVFRJTkdTLCAuLi4ocGFyc2VkLnN0b3J5QWdlbnQgPz8ge30pIH07XHJcbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWFkIHNldHRpbmdzOicsIGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHsgLi4uREVGQVVMVF9TRVRUSU5HUywgc3RvcnlBZ2VudDogeyAuLi5ERUZBVUxUX1NUT1JZX0FHRU5UX1NFVFRJTkdTIH0gfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVTZXR0aW5ncyhzZXR0aW5nczogTUNQU2VydmVyU2V0dGluZ3MpOiB2b2lkIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZW5zdXJlU2V0dGluZ3NEaXIoKTtcclxuICAgICAgICBjb25zdCBzZXR0aW5nc0ZpbGUgPSBnZXRTZXR0aW5nc1BhdGgoKTtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHNldHRpbmdzRmlsZSwgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MsIG51bGwsIDIpKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2F2ZSBzZXR0aW5nczonLCBlKTtcclxuICAgICAgICB0aHJvdyBlO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyDlt6XlhbfnrqHnkIblmajorr7nva7nm7jlhbPlh73mlbBcclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUb29sTWFuYWdlclNldHRpbmdzKCk6IFRvb2xNYW5hZ2VyU2V0dGluZ3Mge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBlbnN1cmVTZXR0aW5nc0RpcigpO1xyXG4gICAgICAgIGNvbnN0IHNldHRpbmdzRmlsZSA9IGdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCk7XHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoc2V0dGluZ3NGaWxlKSkge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNldHRpbmdzRmlsZSwgJ3V0ZjgnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgLi4uREVGQVVMVF9UT09MX01BTkFHRVJfU0VUVElOR1MsIC4uLkpTT04ucGFyc2UoY29udGVudCkgfTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlYWQgdG9vbCBtYW5hZ2VyIHNldHRpbmdzOicsIGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIERFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVRvb2xNYW5hZ2VyU2V0dGluZ3Moc2V0dGluZ3M6IFRvb2xNYW5hZ2VyU2V0dGluZ3MpOiB2b2lkIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZW5zdXJlU2V0dGluZ3NEaXIoKTtcclxuICAgICAgICBjb25zdCBzZXR0aW5nc0ZpbGUgPSBnZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpO1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2V0dGluZ3NGaWxlLCBKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgMikpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHRvb2wgbWFuYWdlciBzZXR0aW5nczonLCBlKTtcclxuICAgICAgICB0aHJvdyBlO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXhwb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnOiBUb29sQ29uZmlndXJhdGlvbik6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGltcG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0pzb246IHN0cmluZyk6IFRvb2xDb25maWd1cmF0aW9uIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgY29uZmlnID0gSlNPTi5wYXJzZShjb25maWdKc29uKTtcclxuICAgICAgICAvLyDpqozor4HphY3nva7moLzlvI9cclxuICAgICAgICBpZiAoIWNvbmZpZy5pZCB8fCAhY29uZmlnLm5hbWUgfHwgIUFycmF5LmlzQXJyYXkoY29uZmlnLnRvb2xzKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29uZmlndXJhdGlvbiBmb3JtYXQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgdG9vbCBjb25maWd1cmF0aW9uOicsIGUpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBKU09OIGZvcm1hdCBvciBjb25maWd1cmF0aW9uIHN0cnVjdHVyZScpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBERUZBVUxUX1NFVFRJTkdTLCBERUZBVUxUX1RPT0xfTUFOQUdFUl9TRVRUSU5HUyB9OyJdfQ==