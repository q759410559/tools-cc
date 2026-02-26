import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../types';
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
      sources: [],
      links: []
    };
    await fs.writeJson(configFile, config, { spaces: 2 });
  }
}

export async function useSource(
  sourceName: string,
  sourceDir: string,
  projectDir: string
): Promise<void> {
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
      const destPath = path.join(toolsccDir, 'skills', `${sourceName}-${skill}`);
      
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
  const config: ProjectConfig = await fs.readJson(configFile);
  if (!config.sources.includes(sourceName)) {
    config.sources.push(sourceName);
  }
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function unuseSource(sourceName: string, projectDir: string): Promise<void> {
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
  
  // Update project config
  const config: ProjectConfig = await fs.readJson(configFile);
  config.sources = config.sources.filter(s => s !== sourceName);
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function listUsedSources(projectDir: string): Promise<string[]> {
  const configFile = getProjectConfigPath(projectDir);
  
  if (!(await fs.pathExists(configFile))) {
    return [];
  }
  
  const config: ProjectConfig = await fs.readJson(configFile);
  return config.sources;
}
