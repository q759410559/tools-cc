import os from 'os';
import path from 'path';

export const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.tools-cc');
export const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

export const DEFAULT_CONFIG = {
  sourcesDir: path.join(GLOBAL_CONFIG_DIR, 'sources'),
  sources: {}
};

export function getToolsccDir(projectDir: string): string {
  return path.join(projectDir, '.toolscc');
}

export function getProjectConfigPath(projectDir: string): string {
  return path.join(getToolsccDir(projectDir), 'config.json');
}
