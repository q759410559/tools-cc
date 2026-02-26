#!/usr/bin/env node

import { Command } from 'commander';
import { handleConfigSet, handleConfigGet } from './commands/config';
import { handleSourceAdd, handleSourceList, handleSourceRemove, handleSourceUpdate } from './commands/source';
import { handleUse, handleList, handleRemove, handleStatus } from './commands/use';
import { GLOBAL_CONFIG_DIR } from './utils/path';

const program = new Command();

program
  .name('tools-cc')
  .description('CLI tool for managing skills/commands/agents across multiple AI coding tools')
  .version('0.0.1');

// Source management
program
  .option('-s, --source <command> [args...]', 'Source management')
  .option('-c, --config <command> [args...]', 'Config management');

// Project commands
program
  .command('use [sources...]')
  .description('Use sources in current project')
  .option('-p, --projects <tools...>', 'Tools to link (iflow, claude, codebuddy, opencode)')
  .action(async (sources: string[], options) => {
    await handleUse(sources, options);
  });

program
  .command('list')
  .description('List sources in use')
  .action(async () => {
    await handleList();
  });

program
  .command('rm <source>')
  .description('Remove a source from project')
  .action(async (source: string) => {
    await handleRemove(source);
  });

program
  .command('status')
  .description('Show project status')
  .action(async () => {
    await handleStatus();
  });

// Main action handler for -s and -c options
program
  .action(async (options) => {
    // Handle -s/--source
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
      return;
    }
    
    // Handle -c/--config
    if (options.config) {
      const [cmd, ...args] = options.config;
      switch (cmd) {
        case 'set':
          if (args.length < 2) {
            console.log('Usage: tools-cc -c set <key> <value>');
            return;
          }
          await handleConfigSet(args[0], args[1]);
          break;
        case 'get':
          if (args.length < 1) {
            console.log('Usage: tools-cc -c get <key>');
            return;
          }
          await handleConfigGet(args[0]);
          break;
        default:
          console.log(`Unknown config command: ${cmd}`);
      }
      return;
    }
    
    // No options provided, show help
    program.outputHelp();
  });

program.parseAsync();
