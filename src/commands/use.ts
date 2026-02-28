import chalk from 'chalk';
import inquirer from 'inquirer';
import { useSource, unuseSource, listUsedSources, initProject } from '../core/project';
import { getSourcePath, listSources } from '../core/source';
import { createSymlink, isSymlink } from '../core/symlink';
import { GLOBAL_CONFIG_DIR, getToolsccDir, getProjectConfigPath } from '../utils/path';
import fs from 'fs-extra';
import path from 'path';

const SUPPORTED_TOOLS: Record<string, string> = {
  iflow: '.iflow',
  claude: '.claude',
  codebuddy: '.codebuddy',
  opencode: '.opencode'
};

export async function handleUse(
  sourceNames: string[],
  options: { projects?: string[] }
): Promise<void> {
  const projectDir = process.cwd();
  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);

  // 检测是否为 "." 模式：使用当前项目已配置的源
  const isDotMode = sourceNames.length === 1 && sourceNames[0] === '.';

  if (isDotMode) {
    // "." 模式：只创建符号链接，不复制源内容
    if (!(await fs.pathExists(configFile))) {
      console.log(chalk.yellow('Project not initialized. Run `tools-cc use <source>` first.'));
      return;
    }

    const config = await fs.readJson(configFile);
    const configuredSources = config.sources || [];

    if (configuredSources.length === 0) {
      console.log(chalk.yellow('No sources configured in this project. Run `tools-cc use <source>` to add one.'));
      return;
    }

    console.log(chalk.cyan(`Using existing sources: ${configuredSources.join(', ')}`));
  } else {
    // 原有逻辑：从全局源复制内容

    // 如果没有指定 source，进入交互模式
    if (sourceNames.length === 0) {
      const sources = await listSources(GLOBAL_CONFIG_DIR);
      const sourceList = Object.keys(sources);

      if (sourceList.length === 0) {
        console.log(chalk.yellow('No sources configured. Use `tools-cc -s add` to add one.'));
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedSources',
          message: 'Select sources to use:',
          choices: sourceList
        }
      ]);

      sourceNames = answers.selectedSources;
    }

    if (sourceNames.length === 0) {
      console.log(chalk.gray('No sources selected.'));
      return;
    }

    // 初始化项目
    await initProject(projectDir);

    // 启用每个配置源
    for (const sourceName of sourceNames) {
      try {
        const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
        await useSource(sourceName, sourcePath, projectDir);
        console.log(chalk.green(`✓ Using source: ${sourceName}`));
      } catch (error) {
        console.log(chalk.red(`✗ Failed to use ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
  }

  // 创建符号链接（两种模式共用）
  const tools = options.projects || Object.keys(SUPPORTED_TOOLS);

  for (const tool of tools) {
    const linkName = SUPPORTED_TOOLS[tool];
    if (!linkName) {
      console.log(chalk.yellow(`Unknown tool: ${tool}`));
      continue;
    }

    const linkPath = path.join(projectDir, linkName);

    try {
      await createSymlink(toolsccDir, linkPath, true);
      console.log(chalk.green(`✓ Linked: ${linkName} -> .toolscc`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to link ${linkName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  // 更新项目配置
  const config = await fs.readJson(configFile);
  const existingLinks = config.links || [];
  config.links = [...new Set([...existingLinks, ...tools])];
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function handleList(): Promise<void> {
  const projectDir = process.cwd();
  const sources = await listUsedSources(projectDir);
  
  if (sources.length === 0) {
    console.log(chalk.gray('No sources in use. Run `tools-cc use <source-name>` to add one.'));
    return;
  }
  
  console.log(chalk.bold('Sources in use:'));
  for (const source of sources) {
    console.log(`  ${chalk.cyan(source)}`);
  }
}

export async function handleRemove(sourceName: string): Promise<void> {
  const projectDir = process.cwd();
  
  try {
    await unuseSource(sourceName, projectDir);
    console.log(chalk.green(`✓ Removed source: ${sourceName}`));
  } catch (error) {
    console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

export async function handleStatus(): Promise<void> {
  const projectDir = process.cwd();
  const sources = await listUsedSources(projectDir);
  
  console.log(chalk.bold('\nProject Status:'));
  console.log(chalk.gray(`  Directory: ${projectDir}`));
  
  // 检查 .toolscc
  const toolsccDir = getToolsccDir(projectDir);
  console.log(`  .toolscc: ${await fs.pathExists(toolsccDir) ? chalk.green('exists') : chalk.red('not found')}`);
  
  // 检查 sources
  console.log(`  Sources: ${sources.length > 0 ? sources.map(s => chalk.cyan(s)).join(', ') : chalk.gray('none')}`);
  
  // 检查 links
  const configFile = getProjectConfigPath(projectDir);
  if (await fs.pathExists(configFile)) {
    const config = await fs.readJson(configFile);
    console.log(`  Links:`);
    for (const tool of config.links || []) {
      const linkName = SUPPORTED_TOOLS[tool];
      if (!linkName) continue;
      const linkPath = path.join(projectDir, linkName);
      const isLink = await isSymlink(linkPath);
      console.log(`    ${tool}: ${isLink ? chalk.green('linked') : chalk.red('not linked')}`);
    }
  }
  console.log();
}

export async function handleProjectUpdate(sourceNames?: string[]): Promise<void> {
  const projectDir = process.cwd();
  const configFile = getProjectConfigPath(projectDir);
  
  // 检查项目是否已初始化
  if (!(await fs.pathExists(configFile))) {
    console.log(chalk.yellow('Project not initialized. Run `tools-cc use <source>` first.'));
    return;
  }
  
  const config = await fs.readJson(configFile);
  let sourcesToUpdate = sourceNames && sourceNames.length > 0 
    ? sourceNames 
    : config.sources || [];
  
  if (sourcesToUpdate.length === 0) {
    console.log(chalk.gray('No sources to update.'));
    return;
  }
  
  // 验证指定的源是否存在于项目配置中
  if (sourceNames && sourceNames.length > 0) {
    const invalidSources = sourceNames.filter((s: string) => !config.sources.includes(s));
    if (invalidSources.length > 0) {
      console.log(chalk.yellow(`Sources not in project: ${invalidSources.join(', ')}`));
    }
    sourcesToUpdate = sourcesToUpdate.filter((s: string) => config.sources.includes(s));
  }
  
  // 更新每个配置源
  for (const sourceName of sourcesToUpdate) {
    try {
      const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
      await useSource(sourceName, sourcePath, projectDir);
      console.log(chalk.green(`✓ Updated source: ${sourceName}`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to update ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  
  console.log(chalk.green(`\n✓ Project update complete`));
}
