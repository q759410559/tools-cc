import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig, LegacyProjectConfig, normalizeProjectConfig } from '../types';
import { loadManifest } from './manifest';
import { getToolsccDir, getProjectConfigPath } from '../utils/path';

export async function initProject(projectDir: string): Promise<void> {
  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);

  // Create .toolscc directory structure
  await fs.ensureDir(path.join(toolsccDir, 'skills'));
  await fs.ensureDir(path.join(toolsccDir, 'commands'));
  await fs.ensureDir(path.join(toolsccDir, 'agents'));

  // Create project config if not exists
  if (!(await fs.pathExists(configFile))) {
    const config: ProjectConfig = {
      sources: {},
      links: []
    };
    await fs.writeJson(configFile, config, { spaces: 2 });
  }
}

/**
 * 读取项目配置，自动处理新旧格式
 */
async function readProjectConfig(configFile: string): Promise<ProjectConfig> {
  const rawConfig = await fs.readJson(configFile);
  return normalizeProjectConfig(rawConfig);
}

/**
 * 获取源名称列表（兼容新旧格式）
 */
function getSourceNames(config: ProjectConfig): string[] {
  return Object.keys(config.sources);
}

export async function useSource(
  sourceName: string,
  sourceDir: string,
  projectDir: string
): Promise<void> {
  // Input validation
  if (!sourceName || !sourceName.trim()) {
    throw new Error('Source name is required');
  }

  // Check source directory existence
  if (!(await fs.pathExists(sourceDir))) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  const toolsccDir = getToolsccDir(projectDir);
  const manifest = await loadManifest(sourceDir);

  // Ensure project is initialized
  await initProject(projectDir);

  // Copy/link skills (flattened with prefix)
  const sourceSkillsDir = path.join(sourceDir, 'skills');
  if (await fs.pathExists(sourceSkillsDir)) {
    const skills = await fs.readdir(sourceSkillsDir);
    for (const skill of skills) {
      const srcPath = path.join(sourceSkillsDir, skill);
      const name = `${sourceName}` == `${skill}` ? skill : `${sourceName}-${skill}`;
      const destPath = path.join(toolsccDir, 'skills', name);

      // Remove existing if exists
      await fs.remove(destPath);

      // Copy directory
      await fs.copy(srcPath, destPath);
    }
  }

  // Copy commands (in subdirectory by source name)
  const sourceCommandsDir = path.join(sourceDir, 'commands');
  if (await fs.pathExists(sourceCommandsDir)) {
    const destDir = path.join(toolsccDir, 'commands', sourceName);
    await fs.remove(destDir);
    await fs.copy(sourceCommandsDir, destDir);
  }

  // Copy agents (in subdirectory by source name)
  const sourceAgentsDir = path.join(sourceDir, 'agents');
  if (await fs.pathExists(sourceAgentsDir)) {
    const destDir = path.join(toolsccDir, 'agents', sourceName);
    await fs.remove(destDir);
    await fs.copy(sourceAgentsDir, destDir);
  }

  // Update project config
  const configFile = getProjectConfigPath(projectDir);
  const config = await readProjectConfig(configFile);
  if (!config.sources[sourceName]) {
    config.sources[sourceName] = {
      skills: ['*'],
      commands: ['*'],
      agents: ['*']
    };
  }
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function unuseSource(sourceName: string, projectDir: string): Promise<void> {
  // Input validation
  if (!sourceName || !sourceName.trim()) {
    throw new Error('Source name is required');
  }

  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);

  // Remove skills with prefix
  const skillsDir = path.join(toolsccDir, 'skills');
  if (await fs.pathExists(skillsDir)) {
    const skills = await fs.readdir(skillsDir);
    for (const skill of skills) {
      if (skill.startsWith(`${sourceName}-`)) {
        await fs.remove(path.join(skillsDir, skill));
      }
    }
  }

  // Remove commands subdirectory
  await fs.remove(path.join(toolsccDir, 'commands', sourceName));

  // Remove agents subdirectory
  await fs.remove(path.join(toolsccDir, 'agents', sourceName));

  // Update project config with error handling
  let config: ProjectConfig;
  try {
    config = await readProjectConfig(configFile);
  } catch (error) {
    // If config file doesn't exist or is invalid, nothing to update
    return;
  }

  delete config.sources[sourceName];
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function listUsedSources(projectDir: string): Promise<string[]> {
  const configFile = getProjectConfigPath(projectDir);

  if (!(await fs.pathExists(configFile))) {
    return [];
  }

  const config = await readProjectConfig(configFile);
  return getSourceNames(config);
}