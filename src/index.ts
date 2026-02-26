#!/usr/bin/env node

import { Command } from 'commander';
import { handleConfigSet, handleConfigGet } from './commands/config';
import { handleSourceAdd, handleSourceList, handleSourceRemove, handleSourceUpdate } from './commands/source';
import { GLOBAL_CONFIG_DIR } from './utils/path';

const program = new Command();

program
  .name('tools-cc')
  .description('CLI tool for managing skills/commands/agents across multiple AI coding tools')
  .version('0.0.1');

// Source commands
program
  .option('-s, --source <command> [args...]', 'Source management')
  .action(async (options) => {
    if (options.source) {
      const [cmd, ...args] = options.source;
      switch (cmd) {
        case 'add':
          if (args.length < 2) {
            console.log('Usage: tools-cc -s add <name> <path-or-url>');
            return;
          }
          await handleSourceAdd(args[0], args[1]);
          break;
        case 'list':
        case 'ls':
          await handleSourceList();
          break;
        case 'remove':
        case 'rm':
          if (args.length < 1) {
            console.log('Usage: tools-cc -s remove <name>');
            return;
          }
          await handleSourceRemove(args[0]);
          break;
        case 'update':
        case 'up':
          await handleSourceUpdate(args[0]);
          break;
        default:
          console.log(`Unknown source command: ${cmd}`);
      }
    }
  });

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
