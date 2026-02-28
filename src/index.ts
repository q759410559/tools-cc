#!/usr/bin/env node

import { Command } from 'commander';
import { handleConfigSet, handleConfigGet, handleConfigList } from './commands/config';
import { handleSourceAdd, handleSourceList, handleSourceRemove, handleSourceUpdate, handleSourceScan } from './commands/source';
import { handleUse, handleList, handleRemove, handleStatus, handleProjectUpdate } from './commands/use';
import { handleExport } from './commands/export';
import { showHelp } from './commands/help';
import { GLOBAL_CONFIG_DIR } from './utils/path';

const program = new Command();

program
  .name('tools-cc')
  .description('CLI tool for managing skills/commands/agents across multiple AI coding tools')
  .version('0.0.1');

// Source management (shortcut options)
program
  .option('-s, --source <command> [args...]', 'Source management (shortcut)')
  .option('-c, --config <command> [args...]', 'Config management (shortcut)');

// Source subcommands (full command version)
const sourceCmd = program
  .command('sources')
  .description('Source management');

sourceCmd
  .command('add <name> <path-or-url>')
  .description('Add a source')
  .action(async (name: string, pathOrUrl: string) => {
    await handleSourceAdd(name, pathOrUrl);
  });

sourceCmd
  .command('list')
  .alias('ls')
  .description('List all sources')
  .action(async () => {
    await handleSourceList();
  });

sourceCmd
  .command('remove <name>')
  .alias('rm')
  .description('Remove a source')
  .action(async (name: string) => {
    await handleSourceRemove(name);
  });

sourceCmd
  .command('update [name]')
  .alias('up')
  .alias('upgrade')
  .description('Update source(s) with git pull')
  .action(async (name?: string) => {
    await handleSourceUpdate(name);
  });

sourceCmd
  .command('scan')
  .description('Scan sources directory and update configuration')
  .action(async () => {
    await handleSourceScan();
  });

// Config subcommands (full command version)
const configCmd = program
  .command('config')
  .description('Config management');

configCmd
  .command('set <key> <value>')
  .description('Set a config value')
  .action(async (key: string, value: string) => {
    await handleConfigSet(key, value);
  });

configCmd
  .command('get <key>')
  .description('Get a config value')
  .action(async (key: string) => {
    await handleConfigGet(key);
  });

configCmd
  .command('list')
  .description('Show full configuration')
  .action(async () => {
    await handleConfigList();
  });

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

program
  .command('update [sources...]')
  .description('Update source(s) in current project')
  .action(async (sources: string[]) => {
    await handleProjectUpdate(sources);
  });

program
  .command('export')
  .description('Export project or global config')
  .option('-o, --output <file>', 'Output file path')
  .option('--global', 'Export global config')
  .action(async (options) => {
    await handleExport(options);
  });

// Help command
program
  .command('help')
  .description('Show bilingual help information')
  .action(() => {
    showHelp();
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
        case 'upgrade':
          await handleSourceUpdate(args[0]);
          break;
        case 'scan':
          await handleSourceScan();
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
