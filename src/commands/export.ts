import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { exportProjectConfig } from '../core/project';
import { loadGlobalConfig } from '../core/config';
import { GLOBAL_CONFIG_DIR } from '../utils/path';
import { GlobalExportConfig } from '../types/config';

/**
 * 导出项目或全局配置
 */
export async function handleExport(options: {
  output?: string;
  global?: boolean;
}): Promise<void> {
  try {
    if (options.global) {
      // 导出全局配置
      await exportGlobalConfig(options.output);
    } else {
      // 导出项目配置
      await exportProjectConfigCmd(options.output);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`✗ Export failed: ${message}`));
    throw error;
  }
}

/**
 * 导出项目配置
 */
async function exportProjectConfigCmd(outputPath?: string): Promise<void> {
  const projectDir = process.cwd();
  const outputFile = outputPath ?? path.join(projectDir, '.toolscc-export.json');

  await exportProjectConfig(projectDir, outputFile);
  console.log(chalk.green(`✓ Project config exported to: ${outputFile}`));
}

/**
 * 导出全局配置
 */
async function exportGlobalConfig(outputPath?: string): Promise<void> {
  const projectDir = process.cwd();
  const outputFile = outputPath ?? path.join(projectDir, '.toolscc-global-export.json');

  const config = await loadGlobalConfig(GLOBAL_CONFIG_DIR);

  const exportConfig: GlobalExportConfig = {
    version: '1.0',
    type: 'global',
    config,
    exportedAt: new Date().toISOString()
  };

  await fs.writeJson(outputFile, exportConfig, { spaces: 2 });
  console.log(chalk.green(`✓ Global config exported to: ${outputFile}`));
}
