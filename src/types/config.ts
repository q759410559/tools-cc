export interface SourceConfig {
  type: 'git' | 'local';
  url?: string;
  path?: string;
}

export interface GlobalConfig {
  sourcesDir: string;
  sources: Record<string, SourceConfig>;
}

export interface ProjectConfig {
  sources: string[];
  links: string[];
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
