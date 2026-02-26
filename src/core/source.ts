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
  
  const source = config.sources[name];
  
  // 如果是 git 类型，清理克隆目录
  if (source.type === 'git') {
    const cloneDir = path.join(config.sourcesDir, name);
    if (await fs.pathExists(cloneDir)) {
      console.log(`Removing cloned directory: ${cloneDir}`);
      await fs.remove(cloneDir);
    }
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

export interface ScanResult {
  added: string[];
  updated: string[];
  skipped: string[];
}

export async function scanSources(configDir: string): Promise<ScanResult> {
  const config = await loadGlobalConfig(configDir);
  const result: ScanResult = { added: [], updated: [], skipped: [] };
  
  // 确保 sourcesDir 存在
  if (!(await fs.pathExists(config.sourcesDir))) {
    await fs.ensureDir(config.sourcesDir);
    return result;
  }
  
  // 获取 sourcesDir 下的所有文件夹
  const entries = await fs.readdir(config.sourcesDir, { withFileTypes: true });
  const directories = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  
  // 检查每个 git source 的克隆目录是否还存在
  for (const [name, source] of Object.entries(config.sources)) {
    if (source.type === 'git') {
      const cloneDir = path.join(config.sourcesDir, name);
      if (!(await fs.pathExists(cloneDir))) {
        // 克隆目录不存在，从配置中移除
        delete config.sources[name];
        console.log(`Removed missing git source: ${name}`);
      }
    }
  }
  
  // 扫描目录并更新配置
  for (const dirName of directories) {
    const dirPath = path.join(config.sourcesDir, dirName);
    const existingSource = config.sources[dirName];
    
    // 检查是否是 git 仓库
    const isGitRepo = await fs.pathExists(path.join(dirPath, '.git'));
    
    if (existingSource) {
      // 已存在配置
      if (existingSource.type === 'git' && isGitRepo) {
        result.skipped.push(dirName);
      } else if (existingSource.type === 'local' && existingSource.path === dirPath) {
        result.skipped.push(dirName);
      } else {
        // 配置不一致，更新为当前状态
        if (isGitRepo) {
          // 尝试获取远程 URL
          try {
            const remoteUrl = execSync(`git -C "${dirPath}" config --get remote.origin.url`, { encoding: 'utf-8' }).trim();
            config.sources[dirName] = { type: 'git', url: remoteUrl };
          } catch {
            config.sources[dirName] = { type: 'local', path: dirPath };
          }
        } else {
          config.sources[dirName] = { type: 'local', path: dirPath };
        }
        result.updated.push(dirName);
      }
    } else {
      // 新发现的目录，添加到配置
      if (isGitRepo) {
        // 尝试获取远程 URL
        try {
          const remoteUrl = execSync(`git -C "${dirPath}" config --get remote.origin.url`, { encoding: 'utf-8' }).trim();
          config.sources[dirName] = { type: 'git', url: remoteUrl };
        } catch {
          config.sources[dirName] = { type: 'local', path: dirPath };
        }
      } else {
        config.sources[dirName] = { type: 'local', path: dirPath };
      }
      result.added.push(dirName);
    }
  }
  
  await saveGlobalConfig(config, configDir);
  return result;
}
