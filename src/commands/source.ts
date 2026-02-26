import chalk from 'chalk';
import { addSource, listSources, removeSource, updateSource } from '../core/source';
import { GLOBAL_CONFIG_DIR } from '../utils/path';

export async function handleSourceAdd(name: string, pathOrUrl: string): Promise<void> {
  try {
    const result = await addSource(name, pathOrUrl, GLOBAL_CONFIG_DIR);
    console.log(chalk.green(`✓ Added source: ${name}`));
    console.log(chalk.gray(`  Type: ${result.type}`));
    if (result.type === 'git') {
      console.log(chalk.gray(`  URL: ${result.url}`));
    } else {
      console.log(chalk.gray(`  Path: ${result.path}`));
    }
  } catch (error) {
    console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

export async function handleSourceList(): Promise<void> {
  const sources = await listSources(GLOBAL_CONFIG_DIR);
  const entries = Object.entries(sources);
  
  if (entries.length === 0) {
    console.log(chalk.gray('No sources configured.'));
    return;
  }
  
  console.log(chalk.bold('Configured sources:'));
  for (const [name, config] of entries) {
    console.log(`  ${chalk.cyan(name)} (${config.type})`);
    if (config.type === 'git') {
      console.log(chalk.gray(`    ${config.url}`));
    } else {
      console.log(chalk.gray(`    ${config.path}`));
    }
  }
}

export async function handleSourceRemove(name: string): Promise<void> {
  try {
    await removeSource(name, GLOBAL_CONFIG_DIR);
    console.log(chalk.green(`✓ Removed source: ${name}`));
  } catch (error) {
    console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

export async function handleSourceUpdate(name?: string): Promise<void> {
  try {
    if (name) {
      await updateSource(name, GLOBAL_CONFIG_DIR);
    } else {
      const sources = await listSources(GLOBAL_CONFIG_DIR);
      for (const sourceName of Object.keys(sources)) {
        await updateSource(sourceName, GLOBAL_CONFIG_DIR);
      }
    }
    console.log(chalk.green(`✓ Update complete`));
  } catch (error) {
    console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}
