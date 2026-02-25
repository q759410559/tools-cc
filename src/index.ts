#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('tools-cc')
  .description('CLI tool for managing skills/commands/agents across multiple AI coding tools')
  .version('0.0.1');

program.parse();
