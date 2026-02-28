import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig, LegacyProjectConfig, normalizeProjectConfig, SourceSelection } from '../types';
import { loadManifest } from './manifest';
import { getToolsccDir, getProjectConfigPath } from '../utils/path';

/**
 * 默认选择配置 - 导入所有内容
 */
const DEFAULT_SELECTION: SourceSelection = {
  skills: ['*'],
  commands: ['*'],
  agents: ['*']
};

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

/**
 * 检查是否应该复制某项（根据选择配置）
 */
function shouldInclude(itemName: string, selection: string[]): boolean {
  // 如果选择包含通配符，包含所有项
  if (selection.includes('*')) {
    return true;
  }
  // 否则检查是否在选择列表中
  return selection.includes(itemName);
}

export async function useSource(
  sourceName: string,
  sourceDir: string,
  projectDir: string,
  selection?: SourceSelection
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

  // 使用传入的选择配置或默认配置
  const effectiveSelection: SourceSelection = selection ?? DEFAULT_SELECTION;

  // Copy/link skills (flattened with prefix)
  const sourceSkillsDir = path.join(sourceDir, 'skills');
  if (await fs.pathExists(sourceSkillsDir)) {
    const skills = await fs.readdir(sourceSkillsDir);
    for (const skill of skills) {
      // 检查是否应该包含此 skill
      if (!shouldInclude(skill, effectiveSelection.skills)) {
        continue;
      }

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
    // 检查是否有选择 commands
    if (effectiveSelection.commands.includes('*')) {
      // 复制所有 commands
      const destDir = path.join(toolsccDir, 'commands', sourceName);
      await fs.remove(destDir);
      await fs.copy(sourceCommandsDir, destDir);
    } else if (effectiveSelection.commands.length > 0) {
      // 只复制选中的 commands
      const destDir = path.join(toolsccDir, 'commands', sourceName);
      await fs.ensureDir(destDir);
      
      for (const cmdName of effectiveSelection.commands) {
        const srcFile = path.join(sourceCommandsDir, `${cmdName}.md`);
        if (await fs.pathExists(srcFile)) {
          await fs.copy(srcFile, path.join(destDir, `${cmdName}.md`));
        }
      }
    }
  }

  // Copy agents (in subdirectory by source name)
  const sourceAgentsDir = path.join(sourceDir, 'agents');
  if (await fs.pathExists(sourceAgentsDir)) {
    // 检查是否有选择 agents
    if (effectiveSelection.agents.includes('*')) {
      // 复制所有 agents
      const destDir = path.join(toolsccDir, 'agents', sourceName);
      await fs.remove(destDir);
      await fs.copy(sourceAgentsDir, destDir);
    } else if (effectiveSelection.agents.length > 0) {
      // 只复制选中的 agents
      const destDir = path.join(toolsccDir, 'agents', sourceName);
      await fs.ensureDir(destDir);
      
      for (const agentName of effectiveSelection.agents) {
        const srcFile = path.join(sourceAgentsDir, `${agentName}.md`);
        if (await fs.pathExists(srcFile)) {
          await fs.copy(srcFile, path.join(destDir, `${agentName}.md`));
        }
      }
    }
  }

  // Update project config - 保存实际使用的选择配置
  const configFile = getProjectConfigPath(projectDir);
  const config = await readProjectConfig(configFile);
  config.sources[sourceName] = effectiveSelection;
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