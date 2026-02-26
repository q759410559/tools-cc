import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { loadGlobalConfig, saveGlobalConfig } from './config';
import { SourceConfig } from '../types';

export async function addSource(
  name: string, 
  sourcePath: string, 
  configDir: string
): Promise<SourceConfig> {
  const config = await loadGlobalConfig(configDir);
  
  // 判断是 git url 还是本地路径
  const isGit = sourcePath.startsWith('http') || sourcePath.startsWith('git@');
  
  let sourceConfig: SourceConfig;
  
  if (isGit) {
    // Clone git repo
    const cloneDir = path.join(config.sourcesDir, name);
    console.log(`Cloning ${sourcePath} to ${cloneDir}...`);
    
    await fs.ensureDir(config.sourcesDir);
    execSync(`git clone ${sourcePath} "${cloneDir}"`, { stdio: 'inherit' });
    
    sourceConfig = { type: 'git', url: sourcePath };
  } else {
    // 本地路径
    const absolutePath = path.resolve(sourcePath);
    if (!(await fs.pathExists(absolutePath))) {
      throw new Error(`Path does not exist: ${absolutePath}`);
    }
    sourceConfig = { type: 'local', path: absolutePath };
  }
  
  config.sources[name] = sourceConfig;
  await saveGlobalConfig(config, configDir);
  
  return sourceConfig;
}

export async function listSources(configDir: string): Promise<Record<string, SourceConfig>> {
  const config = await loadGlobalConfig(configDir);
  return config.sources;
}

export async function removeSource(name: string, configDir: string): Promise<void> {
  const config = await loadGlobalConfig(configDir);
  
  if (!config.sources[name]) {
    throw new Error(`Source not found: ${name}`);
  }
  
  delete config.sources[name];
  await saveGlobalConfig(config, configDir);
}

export async function updateSource(name: string, configDir: string): Promise<void> {
  const config = await loadGlobalConfig(configDir);
  const source = config.sources[name];
  
  if (!source) {
    throw new Error(`Source not found: ${name}`);
  }
  
  if (source.type === 'git') {
    const cloneDir = path.join(config.sourcesDir, name);
    console.log(`Updating ${name}...`);
    execSync(`git -C "${cloneDir}" pull`, { stdio: 'inherit' });
  } else {
    console.log(`Source ${name} is local, no update needed.`);
  }
}

export async function getSourcePath(name: string, configDir: string): Promise<string> {
  const config = await loadGlobalConfig(configDir);
  const source = config.sources[name];
  
  if (!source) {
    throw new Error(`Source not found: ${name}`);
  }
  
  if (source.type === 'local') {
    return source.path!;
  }
  
  return path.join(config.sourcesDir, name);
}
