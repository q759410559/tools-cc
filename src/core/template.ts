import fs from 'fs-extra';
import path from 'path';
import { TemplateConfig, ProjectConfig } from '../types';

/**
 * 保存项目配置为模板
 */
export async function saveTemplate(
  name: string,
  sourceProject: string,
  config: ProjectConfig,
  templatesDir: string
): Promise<TemplateConfig> {
  if (!name || !name.trim()) {
    throw new Error('Template name is required');
  }

  await fs.ensureDir(templatesDir);

  const template: TemplateConfig = {
    version: '1.0',
    name,
    sourceProject,
    savedAt: new Date().toISOString(),
    config
  };

  const templatePath = path.join(templatesDir, `${name}.json`);
  await fs.writeJson(templatePath, template, { spaces: 2 });

  return template;
}

/**
 * 列出所有模板
 */
export async function listTemplates(templatesDir: string): Promise<TemplateConfig[]> {
  if (!(await fs.pathExists(templatesDir))) {
    return [];
  }

  const files = await fs.readdir(templatesDir);
  const templates: TemplateConfig[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const template = await fs.readJson(path.join(templatesDir, file));
        if (template.version && template.name && template.config) {
          templates.push(template);
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  return templates.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/**
 * 获取指定模板
 */
export async function getTemplate(
  name: string,
  templatesDir: string
): Promise<TemplateConfig | null> {
  const templatePath = path.join(templatesDir, `${name}.json`);

  if (!(await fs.pathExists(templatePath))) {
    return null;
  }

  return await fs.readJson(templatePath);
}

/**
 * 删除模板
 */
export async function removeTemplate(
  name: string,
  templatesDir: string
): Promise<void> {
  const templatePath = path.join(templatesDir, `${name}.json`);

  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template not found: ${name}`);
  }

  await fs.remove(templatePath);
}
