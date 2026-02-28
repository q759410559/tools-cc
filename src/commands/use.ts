import chalk from 'chalk';
import inquirer from 'inquirer';
import { useSource, unuseSource, listUsedSources, initProject, importProjectConfig } from '../core/project';
import { getSourcePath, listSources } from '../core/source';
import { scanSource } from '../core/manifest';
import { createSymlink, isSymlink } from '../core/symlink';
import { GLOBAL_CONFIG_DIR, getToolsccDir, getProjectConfigPath } from '../utils/path';
import { parseSourcePath, buildSelectionFromPaths } from '../utils/parsePath';
import { SourceSelection } from '../types/config';
import fs from 'fs-extra';
import path from 'path';

const SUPPORTED_TOOLS: Record<string, string> = {
  iflow: '.iflow',
  claude: '.claude',
  codebuddy: '.codebuddy',
  opencode: '.opencode'
};

/**
 * 默认选择配置 - 导入所有内容
 */
const DEFAULT_SELECTION: SourceSelection = {
  skills: ['*'],
  commands: ['*'],
  agents: ['*']
};

/**
 * use 命令选项
 */
export interface UseOptions {
  projects?: string[];
  ls?: boolean;
  config?: string;
}

/**
 * 处理 use 命令
 * 
 * 支持多种模式：
 * 1. 配置导入模式: tools-cc use -c config.json
 * 2. 交互选择模式: tools-cc use my-source -ls
 * 3. 路径语法模式: tools-cc use my-source/skills/a-skill
 * 4. 整体导入模式: tools-cc use my-source
 * 5. 点模式: tools-cc use . (使用已配置源)
 */
export async function handleUse(
  sourceSpecs: string[],
  options: UseOptions
): Promise<void> {
  const projectDir = process.cwd();
  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);

  // 1. 配置导入模式
  if (options.config) {
    await handleConfigImportMode(options.config, projectDir, options.projects);
    return;
  }

  // 2. 点模式：使用当前项目已配置的源
  if (sourceSpecs.length === 1 && sourceSpecs[0] === '.') {
    await handleDotMode(projectDir, toolsccDir, configFile, options.projects);
    return;
  }

  // 3. 交互选择模式：单个源 + -ls 选项
  if (options.ls && sourceSpecs.length === 1) {
    const parsed = parseSourcePath(sourceSpecs[0]);
    // 只有源名称时才进入交互模式
    if (!parsed.type && parsed.sourceName) {
      await handleInteractiveMode(parsed.sourceName, projectDir, options.projects);
      return;
    }
  }

  // 4. 无参数时显示源选择列表
  if (sourceSpecs.length === 0) {
    sourceSpecs = await selectSourcesInteractively();
    if (sourceSpecs.length === 0) {
      console.log(chalk.gray('No sources selected.'));
      return;
    }
  }

  // 5. 解析路径语法并构建选择配置
  const selectionMap = buildSelectionFromPaths(sourceSpecs);

  // 初始化项目
  await initProject(projectDir);

  // 应用每个源的选择配置
  for (const [sourceName, selection] of Object.entries(selectionMap)) {
    try {
      const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
      await useSource(sourceName, sourcePath, projectDir, selection);
      console.log(chalk.green(`✓ Using source: ${sourceName}`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to use ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  // 创建符号链接
  await createToolLinks(projectDir, toolsccDir, configFile, options.projects);
}

/**
 * 配置导入模式
 */
async function handleConfigImportMode(
  configPath: string,
  projectDir: string,
  projects?: string[]
): Promise<void> {
  try {
    const toolsccDir = getToolsccDir(projectDir);
    const configFile = getProjectConfigPath(projectDir);

    // 解析配置文件路径
    const resolvedPath = path.resolve(configPath);

    // 定义源路径解析函数
    const resolveSourcePath = async (sourceName: string): Promise<string> => {
      return await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
    };

    // 导入配置
    await importProjectConfig(resolvedPath, projectDir, resolveSourcePath);
    console.log(chalk.green(`✓ Imported config from: ${resolvedPath}`));

    // 创建符号链接
    await createToolLinks(projectDir, toolsccDir, configFile, projects);
  } catch (error) {
    console.log(chalk.red(`✗ Failed to import config: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * 点模式：使用已配置源创建符号链接
 */
async function handleDotMode(
  projectDir: string,
  toolsccDir: string,
  configFile: string,
  projects?: string[]
): Promise<void> {
  if (!(await fs.pathExists(configFile))) {
    console.log(chalk.yellow('Project not initialized. Run `tools-cc use <source>` first.'));
    return;
  }

  const config = await fs.readJson(configFile);
  const configuredSources = Object.keys(config.sources || {});

  if (configuredSources.length === 0) {
    console.log(chalk.yellow('No sources configured in this project. Run `tools-cc use <source>` to add one.'));
    return;
  }

  console.log(chalk.cyan(`Using existing sources: ${configuredSources.join(', ')}`));
  await createToolLinks(projectDir, toolsccDir, configFile, projects);
}

/**
 * 交互选择模式：显示技能/命令/代理选择列表
 */
async function handleInteractiveMode(
  sourceName: string,
  projectDir: string,
  projects?: string[]
): Promise<void> {
  try {
    const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
    const manifest = await scanSource(sourcePath);

    // 构建选项列表
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const choices: any[] = [];

    // Skills 组
    if (manifest.skills && manifest.skills.length > 0) {
      choices.push(new inquirer.Separator(`--- Skills (${manifest.skills.length}) ---`));
      for (const skill of manifest.skills) {
        choices.push({ name: skill, value: `skills/${skill}` });
      }
    }

    // Commands 组
    if (manifest.commands && manifest.commands.length > 0) {
      choices.push(new inquirer.Separator(`--- Commands (${manifest.commands.length}) ---`));
      for (const cmd of manifest.commands) {
        choices.push({ name: cmd, value: `commands/${cmd}` });
      }
    }

    // Agents 组
    if (manifest.agents && manifest.agents.length > 0) {
      choices.push(new inquirer.Separator(`--- Agents (${manifest.agents.length}) ---`));
      for (const agent of manifest.agents) {
        choices.push({ name: agent, value: `agents/${agent}` });
      }
    }

    if (choices.length === 0) {
      console.log(chalk.yellow(`No items found in source: ${sourceName}`));
      return;
    }

    // 显示选择列表
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedItems',
        message: `Select items from ${sourceName}:`,
        choices,
        pageSize: 15
      }
    ]);

    if (answers.selectedItems.length === 0) {
      console.log(chalk.gray('No items selected.'));
      return;
    }

    // 将选择转换为 SourceSelection
    const selection: SourceSelection = {
      skills: [],
      commands: [],
      agents: []
    };

    for (const item of answers.selectedItems) {
      const [type, name] = item.split('/');
      if (type === 'skills') selection.skills.push(name);
      else if (type === 'commands') selection.commands.push(name);
      else if (type === 'agents') selection.agents.push(name);
    }

    // 初始化项目并应用选择
    await initProject(projectDir);
    await useSource(sourceName, sourcePath, projectDir, selection);
    console.log(chalk.green(`✓ Using source: ${sourceName}`));

    // 创建符号链接
    const toolsccDir = getToolsccDir(projectDir);
    const configFile = getProjectConfigPath(projectDir);
    await createToolLinks(projectDir, toolsccDir, configFile, projects);
  } catch (error) {
    console.log(chalk.red(`✗ Failed to use ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * 显示源选择列表并返回用户选择
 */
async function selectSourcesInteractively(): Promise<string[]> {
  const sources = await listSources(GLOBAL_CONFIG_DIR);
  const sourceList = Object.keys(sources);

  if (sourceList.length === 0) {
    console.log(chalk.yellow('No sources configured. Use `tools-cc -s add` to add one.'));
    return [];
  }

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSources',
      message: 'Select sources to use:',
      choices: sourceList
    }
  ]);

  return answers.selectedSources;
}

/**
 * 创建工具符号链接
 */
async function createToolLinks(
  projectDir: string,
  toolsccDir: string,
  configFile: string,
  projects?: string[]
): Promise<void> {
  const tools = projects || Object.keys(SUPPORTED_TOOLS);

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
  const configuredSources = Object.keys(config.sources || {});
  
  let sourcesToUpdate = sourceNames && sourceNames.length > 0 
    ? sourceNames 
    : configuredSources;
  
  if (sourcesToUpdate.length === 0) {
    console.log(chalk.gray('No sources to update.'));
    return;
  }
  
  // 验证指定的源是否存在于项目配置中
  if (sourceNames && sourceNames.length > 0) {
    const invalidSources = sourceNames.filter((s: string) => !configuredSources.includes(s));
    if (invalidSources.length > 0) {
      console.log(chalk.yellow(`Sources not in project: ${invalidSources.join(', ')}`));
    }
    sourcesToUpdate = sourcesToUpdate.filter((s: string) => configuredSources.includes(s));
  }
  
  // 更新每个配置源
  for (const sourceName of sourcesToUpdate) {
    try {
      const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
      // 使用保存的选择配置进行更新
      const selection = config.sources[sourceName];
      await useSource(sourceName, sourcePath, projectDir, selection);
      console.log(chalk.green(`✓ Updated source: ${sourceName}`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to update ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  
  console.log(chalk.green(`\n✓ Project update complete`));
}