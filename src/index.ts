#!/usr/bin/env node

import { Command } from 'commander';
import { handleConfigSet, handleConfigGet } from './commands/config';

const program = new Command();

program
  .name('tools-cc')
  .description('CLI tool for managing skills/commands/agents across multiple AI coding tools')
  .version('0.0.1');

// Config commands
program
  .command('config:set <key> <value>')
  .alias('c:set')
  .description('Set a config value')
  .action(async (key: string, value: string) => {
    await handleConfigSet(key, value);
  });

program
  .command('config:get <key>')
  .alias('c:get')
  .description('Get a config value')
  .action(async (key: string) => {
    await handleConfigGet(key);
  });

program.parse();