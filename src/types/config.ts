export interface SourceConfig {
  type: 'git' | 'local';
  url?: string;
  path?: string;
}

export interface GlobalConfig {
  sourcesDir: string;
  sources: Record<string, SourceConfig>;
}

/**
 * 源选择配置 - 指定从源中导入哪些 skills/commands/agents
 */
export interface SourceSelection {
  skills: string[];
  commands: string[];
  agents: string[];
}

/**
 * 新版项目配置 - sources 使用 Record 格式支持部分导入
 */
export interface ProjectConfig {
  sources: Record<string, SourceSelection>;
  links: string[];
}

/**
 * 旧版项目配置 - sources 为字符串数组（向后兼容）
 */
export interface LegacyProjectConfig {
  sources: string[];
  links: string[];
}

/**
 * 判断值是否为有效的 SourceSelection 对象
 */
export function isSourceSelection(value: unknown): value is SourceSelection {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.skills) &&
    Array.isArray(obj.commands) &&
    Array.isArray(obj.agents)
  );
}

/**
 * 将旧版项目配置转换为新版格式
 * 如果 sources 是字符串数组，转换为 Record 格式，每个源默认导入全部内容
 */
export function normalizeProjectConfig(
  config: LegacyProjectConfig | ProjectConfig
): ProjectConfig {
  // If sources is an array, convert to new format
  if (Array.isArray(config.sources)) {
    const newSources: Record<string, SourceSelection> = {};
    for (const sourceName of config.sources) {
      newSources[sourceName] = {
        skills: ['*'],
        commands: ['*'],
        agents: ['*']
      };
    }
    return { sources: newSources, links: config.links };
  }
  return config as ProjectConfig;
}

export interface Manifest {
  name: string;
  version: string;
  skills?: string[];
  commands?: string[];
  agents?: string[];
}

export interface ToolConfig {
  linkName: string;
}

/**
 * 项目配置导出格式
 */
export interface ExportConfig {
  version: string;
  type: 'project';
  config: ProjectConfig;
  exportedAt: string;
}

/**
 * 全局配置导出格式
 */
export interface GlobalExportConfig {
  version: string;
  type: 'global';
  config: GlobalConfig;
  exportedAt: string;
}