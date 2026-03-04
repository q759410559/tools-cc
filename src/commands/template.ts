import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { saveTemplate, listTemplates, removeTemplate, getTemplate } from '../core/template';
import { loadProjectConfig } from '../core/config';
import { importProjectConfig } from '../core/project';
import { getSourcePath } from '../core/source';
import { TEMPLATES_DIR, getProjectConfigPath, GLOBAL_CONFIG_DIR } from '../utils/path';
import fs from 'fs-extra';

/**
 * 处理 template save 命令
 */
export async function handleTemplateSave(options: { name?: string }): Promise<void> {
  const projectDir = process.cwd();
  const configFile = getProjectConfigPath(projectDir);

  // 检查项目配置是否存在
  if (!(await fs.pathExists(configFile))) {
    console.log(chalk.yellow('Project not initialized. Run `tools-cc use <source>` first.'));
    return;
  }

  try {
    // 读取项目配置
    const config = await loadProjectConfig(projectDir);
    if (!config) {
      console.log(chalk.yellow('No project configuration found.'));
      return;
    }

    // 确定模板名称
    let templateName = options.name;
    if (!templateName) {
      templateName = path.basename(projectDir);
    }

    // 检查是否已存在
    const existing = await getTemplate(templateName, TEMPLATES_DIR);
    if (existing) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Template "${templateName}" already exists. Overwrite?`,
          default: false
        }
      ]);
      if (!answers.overwrite) {
        console.log(chalk.gray('Cancelled.'));
        return;
      }
    }

    // 保存模板
    const template = await saveTemplate(templateName, projectDir, config, TEMPLATES_DIR);
    console.log(chalk.green(`✓ Template saved: ${template.name}`));
  } catch (error) {
    console.log(chalk.red(`✗ Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * 处理 template list 命令
 */
export async function handleTemplateList(): Promise<void> {
  const templates = await listTemplates(TEMPLATES_DIR);

  if (templates.length === 0) {
    console.log(chalk.gray('No templates saved.'));
    return;
  }

  console.log(chalk.bold('Saved templates:'));
  for (const template of templates) {
    const date = new Date(template.savedAt).toLocaleDateString();
    console.log(`  ${chalk.cyan(template.name.padEnd(20))} (saved: ${date})`);
  }
}

/**
 * 处理 template rm 命令
 */
export async function handleTemplateRemove(name: string): Promise<void> {
  try {
    await removeTemplate(name, TEMPLATES_DIR);
    console.log(chalk.green(`✓ Template removed: ${name}`));
  } catch (error) {
    console.log(chalk.red(`✗ Failed to remove template: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * 处理 template use 命令
 */
export async function handleTemplateUse(name?: string): Promise<void> {
  const projectDir = process.cwd();
  const configFile = getProjectConfigPath(projectDir);

  // 检查项目是否已初始化
  if (!(await fs.pathExists(configFile))) {
    console.log(chalk.yellow('Project not initialized. Run `tools-cc use <source>` first.'));
    return;
  }

  // 如果没有指定名称，显示选择列表
  if (!name) {
    const templates = await listTemplates(TEMPLATES_DIR);

    if (templates.length === 0) {
      console.log(chalk.gray('No templates saved.'));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTemplate',
        message: 'Select a template to use:',
        choices: templates.map(t => ({
          name: `${t.name} (from: ${path.basename(t.sourceProject)})`,
          value: t.name
        }))
      }
    ]);
    name = answers.selectedTemplate as string;
  }

  // 获取模板
  const template = await getTemplate(name as string, TEMPLATES_DIR);
  if (!template) {
    console.log(chalk.red(`✗ Template not found: ${name}`));
    return;
  }

  // 定义源路径解析函数
  const resolveSourcePath = async (sourceName: string): Promise<string> => {
    return await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
  };

  // 创建临时配置文件
  const tempConfigPath = path.join(projectDir, '.toolscc-template-temp.json');
  const exportConfig = {
    version: '1.0',
    type: 'project' as const,
    config: template.config,
    exportedAt: new Date().toISOString()
  };

  // 导入配置
  try {
    await fs.writeJson(tempConfigPath, exportConfig, { spaces: 2 });
    await importProjectConfig(tempConfigPath, projectDir, resolveSourcePath);
    console.log(chalk.green(`✓ Applied template: ${name}`));
  } catch (error) {
    console.log(chalk.red(`✗ Failed to apply template: ${error instanceof Error ? error.message : 'Unknown error'}`));
  } finally {
    await fs.remove(tempConfigPath);
  }
}
