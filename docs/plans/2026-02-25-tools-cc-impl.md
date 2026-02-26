# tools-cc CLI 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个用于统一管理多个 AI 编程工具的 skills/commands/agents 配置的 CLI 工具

**Architecture:** 单体 CLI 架构，核心模块包括：配置管理、Source 管理、项目管理、符号链接处理。使用 TypeScript 开发，编译为 Node.js 可执行文件。

**Tech Stack:** TypeScript, Node.js, commander (CLI), inquirer (交互), fs-extra (文件操作)

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`

**Step 1: 初始化 npm 项目**

Run: `npm init -y`

**Step 2: 安装依赖**

Run: `npm install commander inquirer fs-extra chalk && npm install -D typescript @types/node @types/inquirer @types/fs-extra ts-node`

**Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: 创建基础入口文件**

Create: `src/index.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('tools-cc')
  .description('CLI tool for managing skills/commands/agents across multiple AI coding tools')
  .version('0.0.1');

program.parse();
```

**Step 5: 添加 npm scripts**

Modify `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js"
  },
  "bin": {
    "tools-cc": "./dist/index.js"
  }
}
```

**Step 6: 验证基础 CLI**

Run: `npm run dev`

Expected: 显示帮助信息

**Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json src/index.ts
git commit -m "chore: initialize project with TypeScript and commander"
```

---

## Task 2: 配置管理模块 - 类型定义

**Files:**
- Create: `src/types/config.ts`
- Create: `src/types/index.ts`

**Step 1: 创建类型定义**

Create: `src/types/config.ts`

```typescript
export interface SourceConfig {
  type: 'git' | 'local';
  url?: string;
  path?: string;
}

export interface GlobalConfig {
  sourcesDir: string;
  sources: Record<string, SourceConfig>;
}

export interface ProjectConfig {
  sources: string[];
  links: string[];
}

export interface Manifest {
  name: string;
  version: string;
  skills?: string[];
  commands?: string[];
  agents?: string[];
}

export interface ToolConfig {
  linkName: string;
}
```

Create: `src/types/index.ts`

```typescript
export * from './config';
```

**Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: add type definitions for config and manifest"
```

---

## Task 3: 配置管理模块 - 全局配置

**Files:**
- Create: `src/utils/path.ts`
- Create: `src/core/config.ts`
- Create: `tests/core/config.test.ts`

**Step 1: 创建路径工具**

Create: `src/utils/path.ts`

```typescript
import os from 'os';
import path from 'path';

export const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.tools-cc');
export const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

export const DEFAULT_CONFIG = {
  sourcesDir: path.join(GLOBAL_CONFIG_DIR, 'sources'),
  sources: {}
};

export function getProjectConfigPath(projectDir: string): string {
  return path.join(projectDir, 'tools-cc.json');
}

export function getToolsccDir(projectDir: string): string {
  return path.join(projectDir, '.toolscc');
}
```

**Step 2: 写配置读取测试**

Create: `tests/core/config.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadGlobalConfig, saveGlobalConfig } from '../../src/core/config';
import { GLOBAL_CONFIG_FILE, GLOBAL_CONFIG_DIR } from '../../src/utils/path';

describe('Config Module', () => {
  const testConfigDir = path.join(__dirname, '../fixtures/.tools-cc');

  beforeEach(async () => {
    await fs.ensureDir(testConfigDir);
  });

  afterEach(async () => {
    await fs.remove(testConfigDir);
  });

  it('should create default config if not exists', async () => {
    const config = await loadGlobalConfig(testConfigDir);
    expect(config.sourcesDir).toBeDefined();
    expect(config.sources).toEqual({});
  });

  it('should save and load config correctly', async () => {
    const testConfig = {
      sourcesDir: '/test/sources',
      sources: {
        'test-source': { type: 'git' as const, url: 'https://github.com/test/repo.git' }
      }
    };
    
    await saveGlobalConfig(testConfig, testConfigDir);
    const loaded = await loadGlobalConfig(testConfigDir);
    
    expect(loaded.sourcesDir).toBe('/test/sources');
    expect(loaded.sources['test-source'].type).toBe('git');
  });
});
```

**Step 3: 运行测试确认失败**

Run: `npm test tests/core/config.test.ts`

Expected: FAIL (模块不存在)

**Step 4: 实现配置模块**

Create: `src/core/config.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';
import { GlobalConfig, ProjectConfig } from '../types';
import { DEFAULT_CONFIG, getProjectConfigPath } from '../utils/path';

export async function loadGlobalConfig(configDir: string): Promise<GlobalConfig> {
  const configFile = path.join(configDir, 'config.json');
  
  if (!(await fs.pathExists(configFile))) {
    await fs.ensureDir(configDir);
    await fs.writeJson(configFile, DEFAULT_CONFIG, { spaces: 2 });
    return DEFAULT_CONFIG;
  }
  
  return await fs.readJson(configFile);
}

export async function saveGlobalConfig(config: GlobalConfig, configDir: string): Promise<void> {
  const configFile = path.join(configDir, 'config.json');
  await fs.ensureDir(configDir);
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function loadProjectConfig(projectDir: string): Promise<ProjectConfig | null> {
  const configFile = getProjectConfigPath(projectDir);
  
  if (!(await fs.pathExists(configFile))) {
    return null;
  }
  
  return await fs.readJson(configFile);
}

export async function saveProjectConfig(config: ProjectConfig, projectDir: string): Promise<void> {
  const configFile = getProjectConfigPath(projectDir);
  await fs.writeJson(configFile, config, { spaces: 2 });
}
```

**Step 5: 安装测试框架**

Run: `npm install -D vitest`

Add to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 6: 运行测试确认通过**

Run: `npm run test:run tests/core/config.test.ts`

Expected: PASS

**Step 7: Commit**

```bash
git add src/utils/path.ts src/core/config.ts tests/core/config.test.ts package.json
git commit -m "feat: add global config management module with tests"
```

---

## Task 4: 配置管理模块 - Config 命令

**Files:**
- Create: `src/commands/config.ts`
- Modify: `src/index.ts`

**Step 1: 实现 config 命令**

Create: `src/commands/config.ts`

```typescript
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
```

**Step 2: 集成到主程序**

Modify `src/index.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { handleConfigSet, handleConfigGet } from './commands/config';
import { GLOBAL_CONFIG_DIR } from './utils/path';

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
```

**Step 3: 测试命令**

Run: `npm run dev -- c:set sourcesDir D:/test-sources`

Expected: `✓ Set sourcesDir to: D:/test-sources`

Run: `npm run dev -- c:get sourcesDir`

Expected: `D:/test-sources`

**Step 4: Commit**

```bash
git add src/commands/config.ts src/index.ts
git commit -m "feat: add config:set and config:get commands"
```

---

## Task 5: Source 管理模块 - 核心逻辑

**Files:**
- Create: `src/core/source.ts`
- Create: `tests/core/source.test.ts`

**Step 1: 写测试**

Create: `tests/core/source.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { addSource, listSources, removeSource } from '../../src/core/source';

describe('Source Module', () => {
  const testConfigDir = path.join(__dirname, '../fixtures/.tools-cc-test');
  const testSourcesDir = path.join(__dirname, '../fixtures/sources');

  beforeEach(async () => {
    await fs.ensureDir(testConfigDir);
    await fs.ensureDir(testSourcesDir);
  });

  afterEach(async () => {
    await fs.remove(testConfigDir);
    await fs.remove(testSourcesDir);
  });

  it('should add a local source', async () => {
    const result = await addSource('test-local', testSourcesDir, testConfigDir);
    expect(result.type).toBe('local');
    expect(result.path).toBe(testSourcesDir);
  });

  it('should list sources', async () => {
    await addSource('test-1', testSourcesDir, testConfigDir);
    const sources = await listSources(testConfigDir);
    expect(sources).toHaveProperty('test-1');
  });

  it('should remove a source', async () => {
    await addSource('test-remove', testSourcesDir, testConfigDir);
    await removeSource('test-remove', testConfigDir);
    const sources = await listSources(testConfigDir);
    expect(sources).not.toHaveProperty('test-remove');
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm run test:run tests/core/source.test.ts`

Expected: FAIL

**Step 3: 实现 Source 模块**

Create: `src/core/source.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { loadGlobalConfig, saveGlobalConfig } from './config';
import { SourceConfig } from '../types';

export async function addSource(
  name: string, 
  sourcePath: string, 
  configDir: string
): Promise<SourceConfig> {
  const config = await loadGlobalConfig(configDir);
  
  // 判断是 git url 还是本地路径
  const isGit = sourcePath.startsWith('http') || sourcePath.startsWith('git@');
  
  let sourceConfig: SourceConfig;
  
  if (isGit) {
    // Clone git repo
    const cloneDir = path.join(config.sourcesDir, name);
    console.log(`Cloning ${sourcePath} to ${cloneDir}...`);
    
    await fs.ensureDir(config.sourcesDir);
    execSync(`git clone ${sourcePath} "${cloneDir}"`, { stdio: 'inherit' });
    
    sourceConfig = { type: 'git', url: sourcePath };
  } else {
    // 本地路径
    const absolutePath = path.resolve(sourcePath);
    if (!(await fs.pathExists(absolutePath))) {
      throw new Error(`Path does not exist: ${absolutePath}`);
    }
    sourceConfig = { type: 'local', path: absolutePath };
  }
  
  config.sources[name] = sourceConfig;
  await saveGlobalConfig(config, configDir);
  
  return sourceConfig;
}

export async function listSources(configDir: string): Promise<Record<string, SourceConfig>> {
  const config = await loadGlobalConfig(configDir);
  return config.sources;
}

export async function removeSource(name: string, configDir: string): Promise<void> {
  const config = await loadGlobalConfig(configDir);
  
  if (!config.sources[name]) {
    throw new Error(`Source not found: ${name}`);
  }
  
  delete config.sources[name];
  await saveGlobalConfig(config, configDir);
}

export async function updateSource(name: string, configDir: string): Promise<void> {
  const config = await loadGlobalConfig(configDir);
  const source = config.sources[name];
  
  if (!source) {
    throw new Error(`Source not found: ${name}`);
  }
  
  if (source.type === 'git') {
    const cloneDir = path.join(config.sourcesDir, name);
    console.log(`Updating ${name}...`);
    execSync(`git -C "${cloneDir}" pull`, { stdio: 'inherit' });
  } else {
    console.log(`Source ${name} is local, no update needed.`);
  }
}

export async function getSourcePath(name: string, configDir: string): Promise<string> {
  const config = await loadGlobalConfig(configDir);
  const source = config.sources[name];
  
  if (!source) {
    throw new Error(`Source not found: ${name}`);
  }
  
  if (source.type === 'local') {
    return source.path!;
  }
  
  return path.join(config.sourcesDir, name);
}
```

**Step 4: 运行测试确认通过**

Run: `npm run test:run tests/core/source.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/source.ts tests/core/source.test.ts
git commit -m "feat: add source management core module with tests"
```

---

## Task 6: Source 命令实现

**Files:**
- Create: `src/commands/source.ts`
- Modify: `src/index.ts`

**Step 1: 实现 source 命令**

Create: `src/commands/source.ts`

```typescript
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
```

**Step 2: 集成到主程序**

Modify `src/index.ts`:

```typescript
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
```

**Step 3: 测试命令**

Run: `npm run dev -- -s list`

Expected: `No sources configured.`

**Step 4: Commit**

```bash
git add src/commands/source.ts src/index.ts
git commit -m "feat: add source management commands (-s add/list/remove/update)"
```

---

## Task 7: Manifest 解析模块

**Files:**
- Create: `src/core/manifest.ts`
- Create: `tests/core/manifest.test.ts`

**Step 1: 写测试**

Create: `tests/core/manifest.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadManifest, scanSource } from '../../src/core/manifest';

describe('Manifest Module', () => {
  const testSourceDir = path.join(__dirname, '../fixtures/test-source');

  beforeEach(async () => {
    await fs.ensureDir(path.join(testSourceDir, 'skills', 'test-skill'));
    await fs.ensureDir(path.join(testSourceDir, 'commands'));
    await fs.ensureDir(path.join(testSourceDir, 'agents'));
  });

  afterEach(async () => {
    await fs.remove(testSourceDir);
  });

  it('should scan source directory without manifest', async () => {
    const manifest = await scanSource(testSourceDir);
    expect(manifest.name).toBe(path.basename(testSourceDir));
    expect(manifest.skills).toContain('test-skill');
  });

  it('should load existing manifest', async () => {
    const manifestPath = path.join(testSourceDir, 'manifest.json');
    await fs.writeJson(manifestPath, {
      name: 'custom-name',
      version: '2.0.0',
      skills: ['skill1']
    });

    const manifest = await loadManifest(testSourceDir);
    expect(manifest.name).toBe('custom-name');
    expect(manifest.version).toBe('2.0.0');
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm run test:run tests/core/manifest.test.ts`

Expected: FAIL

**Step 3: 实现 Manifest 模块**

Create: `src/core/manifest.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';
import { Manifest } from '../types';

export async function loadManifest(sourceDir: string): Promise<Manifest> {
  const manifestPath = path.join(sourceDir, 'manifest.json');
  
  if (await fs.pathExists(manifestPath)) {
    return await fs.readJson(manifestPath);
  }
  
  return scanSource(sourceDir);
}

export async function scanSource(sourceDir: string): Promise<Manifest> {
  const name = path.basename(sourceDir);
  const manifest: Manifest = {
    name,
    version: '0.0.0',
    skills: [],
    commands: [],
    agents: []
  };
  
  // Scan skills
  const skillsDir = path.join(sourceDir, 'skills');
  if (await fs.pathExists(skillsDir)) {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    manifest.skills = entries
      .filter(e => e.isDirectory())
      .map(e => e.name);
  }
  
  // Scan commands
  const commandsDir = path.join(sourceDir, 'commands');
  if (await fs.pathExists(commandsDir)) {
    const entries = await fs.readdir(commandsDir);
    manifest.commands = entries
      .filter(e => e.endsWith('.md'))
      .map(e => e.replace('.md', ''));
  }
  
  // Scan agents
  const agentsDir = path.join(sourceDir, 'agents');
  if (await fs.pathExists(agentsDir)) {
    const entries = await fs.readdir(agentsDir);
    manifest.agents = entries
      .filter(e => e.endsWith('.md'))
      .map(e => e.replace('.md', ''));
  }
  
  return manifest;
}
```

**Step 4: 运行测试确认通过**

Run: `npm run test:run tests/core/manifest.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/manifest.ts tests/core/manifest.test.ts
git commit -m "feat: add manifest loading and scanning module"
```

---

## Task 8: 项目管理模块 - 核心逻辑

**Files:**
- Create: `src/core/project.ts`
- Create: `tests/core/project.test.ts`

**Step 1: 写测试**

Create: `tests/core/project.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { initProject, useSource, unuseSource } from '../../src/core/project';

describe('Project Module', () => {
  const testProjectDir = path.join(__dirname, '../fixtures/test-project');
  const testSourceDir = path.join(__dirname, '../fixtures/test-source');

  beforeEach(async () => {
    await fs.ensureDir(testProjectDir);
    await fs.ensureDir(path.join(testSourceDir, 'skills', 'test-skill'));
  });

  afterEach(async () => {
    await fs.remove(testProjectDir);
    await fs.remove(testSourceDir);
  });

  it('should initialize project with .toolscc directory', async () => {
    await initProject(testProjectDir);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, 'tools-cc.json'))).toBe(true);
  });

  it('should use source and copy components', async () => {
    await initProject(testProjectDir);
    await useSource('test-source', testSourceDir, testProjectDir);
    
    // skills should be flattened with prefix
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'test-source-test-skill'))).toBe(true);
  });

  it('should unuse source and remove components', async () => {
    await initProject(testProjectDir);
    await useSource('test-source', testSourceDir, testProjectDir);
    await unuseSource('test-source', testProjectDir);
    
    const config = await fs.readJson(path.join(testProjectDir, 'tools-cc.json'));
    expect(config.sources).not.toContain('test-source');
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm run test:run tests/core/project.test.ts`

Expected: FAIL

**Step 3: 实现项目模块**

Create: `src/core/project.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../types';
import { loadManifest } from './manifest';
import { getToolsccDir, getProjectConfigPath } from '../utils/path';

export async function initProject(projectDir: string): Promise<void> {
  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);
  
  // Create .toolscc directory structure
  await fs.ensureDir(path.join(toolsccDir, 'skills'));
  await fs.ensureDir(path.join(toolsccDir, 'commands'));
  await fs.ensureDir(path.join(toolsccDir, 'agents'));
  
  // Create project config if not exists
  if (!(await fs.pathExists(configFile))) {
    const config: ProjectConfig = {
      sources: [],
      links: []
    };
    await fs.writeJson(configFile, config, { spaces: 2 });
  }
}

export async function useSource(
  sourceName: string,
  sourceDir: string,
  projectDir: string
): Promise<void> {
  const toolsccDir = getToolsccDir(projectDir);
  const manifest = await loadManifest(sourceDir);
  
  // Ensure project is initialized
  await initProject(projectDir);
  
  // Copy/link skills (flattened with prefix)
  const sourceSkillsDir = path.join(sourceDir, 'skills');
  if (await fs.pathExists(sourceSkillsDir)) {
    const skills = await fs.readdir(sourceSkillsDir);
    for (const skill of skills) {
      const srcPath = path.join(sourceSkillsDir, skill);
      const destPath = path.join(toolsccDir, 'skills', `${sourceName}-${skill}`);
      
      // Remove existing if exists
      await fs.remove(destPath);
      
      // Copy directory
      await fs.copy(srcPath, destPath);
    }
  }
  
  // Copy commands (in subdirectory by source name)
  const sourceCommandsDir = path.join(sourceDir, 'commands');
  if (await fs.pathExists(sourceCommandsDir)) {
    const destDir = path.join(toolsccDir, 'commands', sourceName);
    await fs.remove(destDir);
    await fs.copy(sourceCommandsDir, destDir);
  }
  
  // Copy agents (in subdirectory by source name)
  const sourceAgentsDir = path.join(sourceDir, 'agents');
  if (await fs.pathExists(sourceAgentsDir)) {
    const destDir = path.join(toolsccDir, 'agents', sourceName);
    await fs.remove(destDir);
    await fs.copy(sourceAgentsDir, destDir);
  }
  
  // Update project config
  const configFile = getProjectConfigPath(projectDir);
  const config: ProjectConfig = await fs.readJson(configFile);
  if (!config.sources.includes(sourceName)) {
    config.sources.push(sourceName);
  }
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function unuseSource(sourceName: string, projectDir: string): Promise<void> {
  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);
  
  // Remove skills with prefix
  const skillsDir = path.join(toolsccDir, 'skills');
  if (await fs.pathExists(skillsDir)) {
    const skills = await fs.readdir(skillsDir);
    for (const skill of skills) {
      if (skill.startsWith(`${sourceName}-`)) {
        await fs.remove(path.join(skillsDir, skill));
      }
    }
  }
  
  // Remove commands subdirectory
  await fs.remove(path.join(toolsccDir, 'commands', sourceName));
  
  // Remove agents subdirectory
  await fs.remove(path.join(toolsccDir, 'agents', sourceName));
  
  // Update project config
  const config: ProjectConfig = await fs.readJson(configFile);
  config.sources = config.sources.filter(s => s !== sourceName);
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function listUsedSources(projectDir: string): Promise<string[]> {
  const configFile = getProjectConfigPath(projectDir);
  
  if (!(await fs.pathExists(configFile))) {
    return [];
  }
  
  const config: ProjectConfig = await fs.readJson(configFile);
  return config.sources;
}
```

**Step 4: 运行测试确认通过**

Run: `npm run test:run tests/core/project.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/project.ts tests/core/project.test.ts
git commit -m "feat: add project management module (init/use/unuse)"
```

---

## Task 9: 符号链接模块

**Files:**
- Create: `src/core/symlink.ts`
- Create: `tests/core/symlink.test.ts`

**Step 1: 写测试**

Create: `tests/core/symlink.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { createSymlink, removeSymlink, isSymlink } from '../../src/core/symlink';

describe('Symlink Module', () => {
  const testDir = path.join(__dirname, '../fixtures/symlink-test');
  const targetDir = path.join(testDir, 'target');
  const linkPath = path.join(testDir, 'link');

  beforeEach(async () => {
    await fs.ensureDir(targetDir);
    await fs.writeJson(path.join(targetDir, 'test.json'), { test: true });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create symlink', async () => {
    await createSymlink(targetDir, linkPath);
    expect(await isSymlink(linkPath)).toBe(true);
  });

  it('should remove symlink', async () => {
    await createSymlink(targetDir, linkPath);
    await removeSymlink(linkPath);
    expect(await fs.pathExists(linkPath)).toBe(false);
    expect(await fs.pathExists(targetDir)).toBe(true);
  });

  it('should replace existing directory with symlink', async () => {
    await fs.ensureDir(linkPath);
    await fs.writeFile(path.join(linkPath, 'old.txt'), 'old');
    
    await createSymlink(targetDir, linkPath, true);
    expect(await isSymlink(linkPath)).toBe(true);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm run test:run tests/core/symlink.test.ts`

Expected: FAIL

**Step 3: 实现符号链接模块**

Create: `src/core/symlink.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';

export async function createSymlink(
  target: string,
  linkPath: string,
  force: boolean = false
): Promise<void> {
  // 如果目标已存在
  if (await fs.pathExists(linkPath)) {
    if (!force) {
      throw new Error(`Path already exists: ${linkPath}. Use force=true to overwrite.`);
    }
    
    // 检查是否已经是符号链接
    if (await isSymlink(linkPath)) {
      await fs.remove(linkPath);
    } else {
      // 是真实目录，删除
      await fs.remove(linkPath);
    }
  }
  
  // 确保目标存在
  if (!(await fs.pathExists(target))) {
    throw new Error(`Target does not exist: ${target}`);
  }
  
  // 创建符号链接
  // Windows: 使用 junction (不需要管理员权限)
  // Linux/macOS: 使用 symlink
  const targetPath = path.resolve(target);
  
  if (process.platform === 'win32') {
    // Windows: 使用 junction
    await fs.ensureSymlink(targetPath, linkPath, 'junction');
  } else {
    // Linux/macOS: 使用 dir symlink
    await fs.ensureSymlink(targetPath, linkPath, 'dir');
  }
}

export async function removeSymlink(linkPath: string): Promise<void> {
  if (await isSymlink(linkPath)) {
    await fs.remove(linkPath);
  }
}

export async function isSymlink(path: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}
```

**Step 4: 运行测试确认通过**

Run: `npm run test:run tests/core/symlink.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/symlink.ts tests/core/symlink.test.ts
git commit -m "feat: add symlink management module with Windows junction support"
```

---

## Task 10: Use 命令实现

**Files:**
- Create: `src/commands/use.ts`
- Modify: `src/index.ts`

**Step 1: 实现 use 命令**

Create: `src/commands/use.ts`

```typescript
import chalk from 'chalk';
import inquirer from 'inquirer';
import { useSource, unuseSource, listUsedSources, initProject } from '../core/project';
import { getSourcePath, listSources } from '../core/source';
import { createSymlink, removeSymlink, isSymlink } from '../core/symlink';
import { GLOBAL_CONFIG_DIR, getToolsccDir } from '../utils/path';
import fs from 'fs-extra';
import path from 'path';

const SUPPORTED_TOOLS: Record<string, string> = {
  iflow: '.iflow',
  claude: '.claude',
  codebuddy: '.codebuddy',
  opencode: '.opencode'
};

export async function handleUse(
  sourceNames: string[],
  options: { p?: string[] }
): Promise<void> {
  const projectDir = process.cwd();
  
  // 如果没有指定 source，进入交互模式
  if (sourceNames.length === 0) {
    const sources = await listSources(GLOBAL_CONFIG_DIR);
    const sourceList = Object.keys(sources);
    
    if (sourceList.length === 0) {
      console.log(chalk.yellow('No sources configured. Use `tools-cc -s add` to add one.'));
      return;
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSources',
        message: 'Select sources to use:',
        choices: sourceList
      }
    ]);
    
    sourceNames = answers.selectedSources;
  }
  
  if (sourceNames.length === 0) {
    console.log(chalk.gray('No sources selected.'));
    return;
  }
  
  // 初始化项目
  await initProject(projectDir);
  
  // 启用每个配置源
  for (const sourceName of sourceNames) {
    try {
      const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
      await useSource(sourceName, sourcePath, projectDir);
      console.log(chalk.green(`✓ Using source: ${sourceName}`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to use ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  
  // 创建符号链接
  const tools = options.p || Object.keys(SUPPORTED_TOOLS);
  const toolsccDir = getToolsccDir(projectDir);
  
  for (const tool of tools) {
    const linkName = SUPPORTED_TOOLS[tool];
    if (!linkName) {
      console.log(chalk.yellow(`Unknown tool: ${tool}`));
      continue;
    }
    
    const linkPath = path.join(projectDir, linkName);
    
    try {
      await createSymlink(toolsccDir, linkPath, true);
      console.log(chalk.green(`✓ Linked: ${linkName} -> .toolscc`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to link ${linkName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  
  // 更新项目配置
  const configFile = path.join(projectDir, 'tools-cc.json');
  const config = await fs.readJson(configFile);
  config.links = tools;
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function handleList(): Promise<void> {
  const projectDir = process.cwd();
  const sources = await listUsedSources(projectDir);
  
  if (sources.length === 0) {
    console.log(chalk.gray('No sources in use. Run `tools-cc use <source-name>` to add one.'));
    return;
  }
  
  console.log(chalk.bold('Sources in use:'));
  for (const source of sources) {
    console.log(`  ${chalk.cyan(source)}`);
  }
}

export async function handleRemove(sourceName: string): Promise<void> {
  const projectDir = process.cwd();
  
  try {
    await unuseSource(sourceName, projectDir);
    console.log(chalk.green(`✓ Removed source: ${sourceName}`));
  } catch (error) {
    console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

export async function handleStatus(): Promise<void> {
  const projectDir = process.cwd();
  const sources = await listUsedSources(projectDir);
  
  console.log(chalk.bold('\nProject Status:'));
  console.log(chalk.gray(`  Directory: ${projectDir}`));
  
  // 检查 .toolscc
  const toolsccDir = getToolsccDir(projectDir);
  console.log(`  .toolscc: ${await fs.pathExists(toolsccDir) ? chalk.green('exists') : chalk.red('not found')}`);
  
  // 检查 sources
  console.log(`  Sources: ${sources.length > 0 ? sources.map(s => chalk.cyan(s)).join(', ') : chalk.gray('none')}`);
  
  // 检查 links
  const configFile = path.join(projectDir, 'tools-cc.json');
  if (await fs.pathExists(configFile)) {
    const config = await fs.readJson(configFile);
    console.log(`  Links:`);
    for (const tool of config.links || []) {
      const linkName = SUPPORTED_TOOLS[tool];
      const linkPath = path.join(projectDir, linkName);
      const isLink = await isSymlink(linkPath);
      console.log(`    ${tool}: ${isLink ? chalk.green('linked') : chalk.red('not linked')}`);
    }
  }
  console.log();
}
```

**Step 2: 重构主程序**

Modify `src/index.ts`:

```typescript
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

program.parseAsync().then(async () => {
  const options = program.opts();
  
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
});
```

**Step 3: 测试完整工作流**

Run: `npm run build`

Run: `npm link`

Run: `tools-cc status`

Expected: 显示项目状态

**Step 4: Commit**

```bash
git add src/commands/use.ts src/index.ts
git commit -m "feat: add use/list/rm/status commands for project management"
```

---

## Task 11: 添加 .gitignore

**Files:**
- Create: `.gitignore`

**Step 1: 创建 .gitignore**

```gitignore
# Dependencies
node_modules/

# Build
dist/

# Test
coverage/
tests/fixtures/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Local config
.tools-cc/
*.local.json
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

## Task 12: 最终构建和测试

**Step 1: 运行所有测试**

Run: `npm run test:run`

Expected: All tests pass

**Step 2: 构建**

Run: `npm run build`

Expected: Build succeeds

**Step 3: 本地测试完整工作流**

```bash
# 1. 设置配置
tools-cc -c set sourcesDir D:/test-sources

# 2. 添加一个本地配置源
tools-cc -s add test-source D:/path/to/existing/skills

# 3. 查看配置源
tools-cc -s list

# 4. 在项目中使用
cd /path/to/test/project
tools-cc use test-source -p iflow claude

# 5. 查看状态
tools-cc status

# 6. 查看已使用的配置源
tools-cc list

# 7. 移除配置源
tools-cc rm test-source
```

**Step 4: 最终 Commit**

```bash
git add .
git commit -m "chore: final build and test"
```

---

## 执行选项

计划已保存到 `docs/plans/2026-02-25-tools-cc-impl.md`

**两种执行方式：**

**1. Subagent-Driven (当前会话)** - 在此会话中逐任务派发子代理执行，任务间可审查，快速迭代

**2. Parallel Session (单独会话)** - 打开新会话使用 executing-plans，批量执行带检查点

**选择哪种方式？**
