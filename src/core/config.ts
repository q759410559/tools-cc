import fs from 'fs-extra';
import path from 'path';
import { GlobalConfig, ProjectConfig } from '../types';
import { DEFAULT_CONFIG, getProjectConfigPath } from '../utils/path';

export async function loadGlobalConfig(configDir: string): Promise<GlobalConfig> {
  const configFile = path.join(configDir, 'config.json');
  
  if (!(await fs.pathExists(configFile))) {
    await fs.ensureDir(configDir);
    await fs.writeJson(configFile, DEFAULT_CONFIG, { spaces: 2 });
    return DEFAULT_CONFIG;
  }
  
  return await fs.readJson(configFile);
}

export async function saveGlobalConfig(config: GlobalConfig, configDir: string): Promise<void> {
  const configFile = path.join(configDir, 'config.json');
  await fs.ensureDir(configDir);
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function loadProjectConfig(projectDir: string): Promise<ProjectConfig | null> {
  const configFile = getProjectConfigPath(projectDir);
  
  if (!(await fs.pathExists(configFile))) {
    return null;
  }
  
  return await fs.readJson(configFile);
}

export async function saveProjectConfig(config: ProjectConfig, projectDir: string): Promise<void> {
  const configFile = getProjectConfigPath(projectDir);
  await fs.writeJson(configFile, config, { spaces: 2 });
}
