import chalk from 'chalk';
import { loadGlobalConfig, saveGlobalConfig } from '../core/config';
import { GLOBAL_CONFIG_DIR } from '../utils/path';

export async function handleConfigSet(key: string, value: string): Promise<void> {
  const config = await loadGlobalConfig(GLOBAL_CONFIG_DIR);
  
  if (key === 'sourcesDir') {
    config.sourcesDir = value;
    await saveGlobalConfig(config, GLOBAL_CONFIG_DIR);
    console.log(chalk.green(`✓ Set sourcesDir to: ${value}`));
  } else {
    console.log(chalk.red(`✗ Unknown config key: ${key}`));
    console.log(chalk.gray('Available keys: sourcesDir'));
  }
}

export async function handleConfigGet(key: string): Promise<void> {
  const config = await loadGlobalConfig(GLOBAL_CONFIG_DIR);
  
  if (key === 'sourcesDir') {
    console.log(config.sourcesDir);
  } else if (key === 'all') {
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log(chalk.red(`✗ Unknown config key: ${key}`));
  }
}
