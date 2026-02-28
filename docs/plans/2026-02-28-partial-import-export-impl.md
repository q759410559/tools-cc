# 部分引入与配置导入导出功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 tools-cc 新增部分引入功能（选择性引入 skills/commands/agents）和配置导入导出功能。

**Architecture:** 扩展现有类型定义支持选择记录，重构 useSource 函数支持部分复制，新增 export 命令处理配置导出，扩展 use 命令支持路径语法和配置导入。

**Tech Stack:** TypeScript, fs-extra, inquirer, vitest

---

## Task 1: 更新类型定义

**Files:**
- Modify: `src/types/config.ts`
- Test: `tests/types/config.test.ts`

**Step 1: 创建类型测试文件**

```typescript
// tests/types/config.test.ts
import { describe, it, expect } from 'vitest';
import { isSourceSelection, normalizeProjectConfig } from '../../src/types/config';

describe('Types Config', () => {
  it('should identify valid SourceSelection', () => {
    const selection = { skills: ['a'], commands: [], agents: ['*'] };
    expect(isSourceSelection(selection)).toBe(true);
  });

  it('should normalize old format to new format', () => {
    const oldConfig = { sources: ['my-skills'], links: ['iflow'] };
    const normalized = normalizeProjectConfig(oldConfig);
    expect(normalized.sources).toEqual({
      'my-skills': { skills: ['*'], commands: ['*'], agents: ['*'] }
    });
  });

  it('should keep new format unchanged', () => {
    const newConfig = {
      sources: { 'my-skills': { skills: ['a'], commands: [], agents: [] } },
      links: ['iflow']
    };
    const normalized = normalizeProjectConfig(newConfig);
    expect(normalized).toEqual(newConfig);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm run test:run tests/types/config.test.ts
```

Expected: FAIL - isSourceSelection 和 normalizeProjectConfig 未定义

**Step 3: 更新类型定义文件**

```typescript
// src/types/config.ts
export interface SourceConfig {
  type: 'git' | 'local';
  url?: string;
  path?: string;
}

export interface GlobalConfig {
  sourcesDir: string;
  sources: Record<string, SourceConfig>;
}

export interface SourceSelection {
  skills: string[];
  commands: string[];
  agents: string[];
}

export interface ProjectConfig {
  sources: Record<string, SourceSelection>;
  links: string[];
}

// 兼容旧格式的类型
export interface LegacyProjectConfig {
  sources: string[];
  links: string[];
}

// 类型守卫：判断是否为 SourceSelection
export function isSourceSelection(value: unknown): value is SourceSelection {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.skills) &&
    Array.isArray(obj.commands) &&
    Array.isArray(obj.agents)
  );
}

// 标准化项目配置（兼容旧格式）
export function normalizeProjectConfig(
  config: LegacyProjectConfig | ProjectConfig
): ProjectConfig {
  // 如果 sources 是数组，转换为新格式
  if (Array.isArray(config.sources)) {
    const newSources: Record<string, SourceSelection> = {};
    for (const sourceName of config.sources) {
      newSources[sourceName] = {
        skills: ['*'],
        commands: ['*'],
        agents: ['*']
      };
    }
    return { sources: newSources, links: config.links };
  }
  return config as ProjectConfig;
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

// 导出配置文件格式
export interface ExportConfig {
  version: string;
  sources: Record<string, SourceSelection>;
  links: string[];
}

// 全局配置导出格式
export interface GlobalExportConfig {
  version: string;
  sourcesDir: string;
  sources: Record<string, SourceConfig>;
}
```

**Step 4: 运行测试验证通过**

```bash
npm run test:run tests/types/config.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/types/config.ts tests/types/config.test.ts
git commit -m "feat(types): add SourceSelection and normalizeProjectConfig"
```

---

## Task 2: 添加路径解析工具函数

**Files:**
- Create: `src/utils/parsePath.ts`
- Test: `tests/utils/parsePath.test.ts`

**Step 1: 创建测试文件**

```typescript
// tests/utils/parsePath.test.ts
import { describe, it, expect } from 'vitest';
import { parseSourcePath, buildSelectionFromPaths } from '../../src/utils/parsePath';

describe('parseSourcePath', () => {
  it('should parse source only', () => {
    const result = parseSourcePath('my-skills');
    expect(result).toEqual({ sourceName: 'my-skills' });
  });

  it('should parse skill path', () => {
    const result = parseSourcePath('my-skills/skills/a-skill');
    expect(result).toEqual({
      sourceName: 'my-skills',
      type: 'skills',
      itemName: 'a-skill'
    });
  });

  it('should parse command path', () => {
    const result = parseSourcePath('my-skills/commands/test');
    expect(result).toEqual({
      sourceName: 'my-skills',
      type: 'commands',
      itemName: 'test'
    });
  });

  it('should parse agent path', () => {
    const result = parseSourcePath('other/agents/reviewer');
    expect(result).toEqual({
      sourceName: 'other',
      type: 'agents',
      itemName: 'reviewer'
    });
  });
});

describe('buildSelectionFromPaths', () => {
  it('should build selection from multiple paths', () => {
    const paths = [
      'my-skills/skills/a-skill',
      'my-skills/skills/b-skill',
      'my-skills/commands/test'
    ];
    const result = buildSelectionFromPaths(paths);
    expect(result).toEqual({
      'my-skills': {
        skills: ['a-skill', 'b-skill'],
        commands: ['test'],
        agents: []
      }
    });
  });

  it('should handle multiple sources', () => {
    const paths = [
      'source1/skills/a',
      'source2/agents/b'
    ];
    const result = buildSelectionFromPaths(paths);
    expect(result).toEqual({
      source1: { skills: ['a'], commands: [], agents: [] },
      source2: { skills: [], commands: [], agents: ['b'] }
    });
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm run test:run tests/utils/parsePath.test.ts
```

Expected: FAIL - 模块未找到

**Step 3: 实现路径解析函数**

```typescript
// src/utils/parsePath.ts
import { SourceSelection } from '../types/config';

export interface ParsedSourcePath {
  sourceName: string;
  type?: 'skills' | 'commands' | 'agents';
  itemName?: string;
}

/**
 * 解析源路径字符串
 * my-skills -> { sourceName: "my-skills" }
 * my-skills/skills/a-skill -> { sourceName: "my-skills", type: "skills", itemName: "a-skill" }
 */
export function parseSourcePath(input: string): ParsedSourcePath {
  const parts = input.split('/');

  if (parts.length === 1) {
    return { sourceName: parts[0] };
  }

  if (parts.length >= 3) {
    const [sourceName, type, itemName] = parts;
    if (type === 'skills' || type === 'commands' || type === 'agents') {
      return { sourceName, type, itemName };
    }
  }

  // 无效路径，返回源名
  return { sourceName: parts[0] };
}

/**
 * 从路径列表构建选择配置
 */
export function buildSelectionFromPaths(paths: string[]): Record<string, SourceSelection> {
  const result: Record<string, SourceSelection> = {};

  for (const pathStr of paths) {
    const parsed = parseSourcePath(pathStr);

    if (!result[parsed.sourceName]) {
      result[parsed.sourceName] = { skills: [], commands: [], agents: [] };
    }

    if (parsed.type && parsed.itemName) {
      const selection = result[parsed.sourceName];
      if (!selection[parsed.type].includes(parsed.itemName)) {
        selection[parsed.type].push(parsed.itemName);
      }
    }
  }

  return result;
}
```

**Step 4: 运行测试验证通过**

```bash
npm run test:run tests/utils/parsePath.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/utils/parsePath.ts tests/utils/parsePath.test.ts
git commit -m "feat(utils): add parseSourcePath and buildSelectionFromPaths"
```

---

## Task 3: 重构 useSource 支持部分引入

**Files:**
- Modify: `src/core/project.ts`
- Modify: `tests/core/project.test.ts`

**Step 1: 添加测试用例**

```typescript
// tests/core/project.test.ts 追加内容

describe('Partial useSource', () => {
  const partialTestDir = path.join(__dirname, '../fixtures/partial-test');
  const partialSourceDir = path.join(__dirname, '../fixtures/partial-source');

  beforeEach(async () => {
    await fs.ensureDir(partialTestDir);
    // 创建测试源结构
    await fs.ensureDir(path.join(partialSourceDir, 'skills', 'skill-a'));
    await fs.ensureDir(path.join(partialSourceDir, 'skills', 'skill-b'));
    await fs.ensureDir(path.join(partialSourceDir, 'commands'));
    await fs.writeFile(path.join(partialSourceDir, 'commands', 'cmd1.md'), '# cmd1');
    await fs.ensureDir(path.join(partialSourceDir, 'agents'));
    await fs.writeFile(path.join(partialSourceDir, 'agents', 'agent1.md'), '# agent1');
  });

  afterEach(async () => {
    await fs.remove(partialTestDir);
    await fs.remove(partialSourceDir);
  });

  it('should copy only selected skills', async () => {
    await initProject(partialTestDir);
    const selection: SourceSelection = {
      skills: ['skill-a'],
      commands: [],
      agents: []
    };
    await useSource('partial-source', partialSourceDir, partialTestDir, selection);

    expect(await fs.pathExists(path.join(partialTestDir, '.toolscc', 'skills', 'partial-source-skill-a'))).toBe(true);
    expect(await fs.pathExists(path.join(partialTestDir, '.toolscc', 'skills', 'partial-source-skill-b'))).toBe(false);
  });

  it('should copy all when selection has wildcard', async () => {
    await initProject(partialTestDir);
    const selection: SourceSelection = {
      skills: ['*'],
      commands: ['*'],
      agents: ['*']
    };
    await useSource('partial-source', partialSourceDir, partialTestDir, selection);

    expect(await fs.pathExists(path.join(partialTestDir, '.toolscc', 'skills', 'partial-source-skill-a'))).toBe(true);
    expect(await fs.pathExists(path.join(partialTestDir, '.toolscc', 'skills', 'partial-source-skill-b'))).toBe(true);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm run test:run tests/core/project.test.ts
```

Expected: FAIL - useSource 不支持第四个参数

**Step 3: 重构 useSource 函数**

```typescript
// src/core/project.ts
import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig, SourceSelection, normalizeProjectConfig } from '../types';
import { loadManifest } from './manifest';
import { getToolsccDir, getProjectConfigPath } from '../utils/path';

// 默认选择：全部引入
const DEFAULT_SELECTION: SourceSelection = {
  skills: ['*'],
  commands: ['*'],
  agents: ['*']
};

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
      sources: {},
      links: []
    };
    await fs.writeJson(configFile, config, { spaces: 2 });
  }
}

export async function useSource(
  sourceName: string,
  sourceDir: string,
  projectDir: string,
  selection?: SourceSelection
): Promise<void> {
  // Input validation
  if (!sourceName || !sourceName.trim()) {
    throw new Error('Source name is required');
  }

  // Check source directory existence
  if (!(await fs.pathExists(sourceDir))) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  const toolsccDir = getToolsccDir(projectDir);
  const manifest = await loadManifest(sourceDir);
  const effectiveSelection = selection || DEFAULT_SELECTION;

  // Ensure project is initialized
  await initProject(projectDir);

  // Copy skills (selective or all)
  const sourceSkillsDir = path.join(sourceDir, 'skills');
  if (await fs.pathExists(sourceSkillsDir)) {
    const allSkills = (await fs.readdir(sourceSkillsDir)).filter(name => {
      const skillPath = path.join(sourceSkillsDir, name);
      return (await fs.stat(skillPath)).isDirectory();
    });

    const skillsToCopy = effectiveSelection.skills.includes('*')
      ? allSkills
      : effectiveSelection.skills.filter(s => allSkills.includes(s));

    for (const skill of skillsToCopy) {
      const srcPath = path.join(sourceSkillsDir, skill);
      const name = `${sourceName}-${skill}`;
      const destPath = path.join(toolsccDir, 'skills', name);

      await fs.remove(destPath);
      await fs.copy(srcPath, destPath);
    }
  }

  // Copy commands (selective or all)
  const sourceCommandsDir = path.join(sourceDir, 'commands');
  if (await fs.pathExists(sourceCommandsDir)) {
    const destDir = path.join(toolsccDir, 'commands', sourceName);

    if (effectiveSelection.commands.includes('*')) {
      await fs.remove(destDir);
      await fs.copy(sourceCommandsDir, destDir);
    } else {
      await fs.ensureDir(destDir);
      for (const cmd of effectiveSelection.commands) {
        const srcFile = path.join(sourceCommandsDir, `${cmd}.md`);
        if (await fs.pathExists(srcFile)) {
          await fs.copy(srcFile, path.join(destDir, `${cmd}.md`));
        }
      }
    }
  }

  // Copy agents (selective or all)
  const sourceAgentsDir = path.join(sourceDir, 'agents');
  if (await fs.pathExists(sourceAgentsDir)) {
    const destDir = path.join(toolsccDir, 'agents', sourceName);

    if (effectiveSelection.agents.includes('*')) {
      await fs.remove(destDir);
      await fs.copy(sourceAgentsDir, destDir);
    } else {
      await fs.ensureDir(destDir);
      for (const agent of effectiveSelection.agents) {
        const srcFile = path.join(sourceAgentsDir, `${agent}.md`);
        if (await fs.pathExists(srcFile)) {
          await fs.copy(srcFile, path.join(destDir, `${agent}.md`));
        }
      }
    }
  }

  // Update project config
  const configFile = getProjectConfigPath(projectDir);
  let config = await fs.readJson(configFile);
  config = normalizeProjectConfig(config);

  config.sources[sourceName] = effectiveSelection;
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function unuseSource(sourceName: string, projectDir: string): Promise<void> {
  // Input validation
  if (!sourceName || !sourceName.trim()) {
    throw new Error('Source name is required');
  }

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

  // Update project config with error handling
  let config: ProjectConfig;
  try {
    config = await fs.readJson(configFile);
    config = normalizeProjectConfig(config);
  } catch (error) {
    return;
  }

  delete config.sources[sourceName];
  await fs.writeJson(configFile, config, { spaces: 2 });
}

export async function listUsedSources(projectDir: string): Promise<string[]> {
  const configFile = getProjectConfigPath(projectDir);

  if (!(await fs.pathExists(configFile))) {
    return [];
  }

  const config = await fs.readJson(configFile);
  const normalized = normalizeProjectConfig(config);
  return Object.keys(normalized.sources);
}
```

**Step 4: 更新导入并运行测试**

```typescript
// tests/core/project.test.ts 顶部添加导入
import { SourceSelection } from '../../src/types/config';
```

```bash
npm run test:run tests/core/project.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/core/project.ts tests/core/project.test.ts
git commit -m "feat(core): refactor useSource to support partial import"
```

---

## Task 4: 添加导入导出函数

**Files:**
- Modify: `src/core/project.ts`
- Modify: `tests/core/project.test.ts`

**Step 1: 添加测试用例**

```typescript
// tests/core/project.test.ts 追加内容

describe('Export/Import config', () => {
  const exportTestDir = path.join(__dirname, '../fixtures/export-test');
  const exportSourceDir = path.join(__dirname, '../fixtures/export-source');
  const exportFile = path.join(__dirname, '../fixtures/export-config.json');

  beforeEach(async () => {
    await fs.ensureDir(exportTestDir);
    await fs.ensureDir(path.join(exportSourceDir, 'skills', 'test-skill'));
  });

  afterEach(async () => {
    await fs.remove(exportTestDir);
    await fs.remove(exportSourceDir);
    await fs.remove(exportFile);
  });

  it('should export project config', async () => {
    await initProject(exportTestDir);
    const selection: SourceSelection = {
      skills: ['test-skill'],
      commands: [],
      agents: []
    };
    await useSource('export-source', exportSourceDir, exportTestDir, selection);

    await exportProjectConfig(exportTestDir, exportFile);

    const exported = await fs.readJson(exportFile);
    expect(exported.version).toBe('1.0');
    expect(exported.sources['export-source']).toEqual(selection);
  });

  it('should import project config', async () => {
    // 创建导出文件
    const config = {
      version: '1.0',
      sources: {
        'import-source': {
          skills: ['*'],
          commands: [],
          agents: []
        }
      },
      links: ['iflow']
    };
    await fs.writeJson(exportFile, config);

    // 创建源目录
    await fs.ensureDir(path.join(exportSourceDir, 'skills', 'import-skill'));

    await importProjectConfig(exportFile, exportTestDir, async (name) => {
      if (name === 'import-source') return exportSourceDir;
      throw new Error('Unknown source');
    });

    const imported = await fs.readJson(path.join(exportTestDir, 'tools-cc.json'));
    expect(imported.sources['import-source']).toBeDefined();
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm run test:run tests/core/project.test.ts
```

Expected: FAIL - exportProjectConfig 和 importProjectConfig 未导出

**Step 3: 添加导入导出函数**

```typescript
// src/core/project.ts 追加内容

import { ExportConfig } from '../types';

/**
 * 导出项目配置到文件
 */
export async function exportProjectConfig(
  projectDir: string,
  outputPath: string
): Promise<void> {
  const configFile = getProjectConfigPath(projectDir);

  if (!(await fs.pathExists(configFile))) {
    throw new Error('Project not initialized');
  }

  const config = await fs.readJson(configFile);
  const normalized = normalizeProjectConfig(config);

  const exportData: ExportConfig = {
    version: '1.0',
    sources: normalized.sources,
    links: normalized.links
  };

  await fs.writeJson(outputPath, exportData, { spaces: 2 });
}

/**
 * 从配置文件导入项目配置
 */
export async function importProjectConfig(
  configPath: string,
  projectDir: string,
  resolveSourcePath: (sourceName: string) => Promise<string>
): Promise<void> {
  const importData = await fs.readJson(configPath);

  // 验证版本
  if (importData.version !== '1.0') {
    throw new Error(`Unsupported config version: ${importData.version}`);
  }

  // 确保项目已初始化
  await initProject(projectDir);

  // 按配置引入每个源
  for (const [sourceName, selection] of Object.entries(importData.sources as Record<string, SourceSelection>)) {
    const sourcePath = await resolveSourcePath(sourceName);
    await useSource(sourceName, sourcePath, projectDir, selection);
  }

  // 更新 links
  const configFile = getProjectConfigPath(projectDir);
  const config = await fs.readJson(configFile);
  config.links = importData.links || [];
  await fs.writeJson(configFile, config, { spaces: 2 });
}
```

**Step 4: 更新类型导出**

```typescript
// src/types/index.ts
export * from './config';
```

**Step 5: 更新测试导入**

```typescript
// tests/core/project.test.ts 添加导入
import { exportProjectConfig, importProjectConfig } from '../../src/core/project';
```

**Step 6: 运行测试**

```bash
npm run test:run tests/core/project.test.ts
```

Expected: PASS

**Step 7: 提交**

```bash
git add src/core/project.ts src/types/index.ts tests/core/project.test.ts
git commit -m "feat(core): add exportProjectConfig and importProjectConfig"
```

---

## Task 5: 创建 export 命令

**Files:**
- Create: `src/commands/export.ts`
- Create: `tests/commands/export.test.ts`
- Modify: `src/index.ts`

**Step 1: 创建测试文件**

```typescript
// tests/commands/export.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { handleExport } from '../../src/commands/export';

describe('Export Command', () => {
  const testDir = path.join(__dirname, '../fixtures/export-cmd-test');
  const configFile = path.join(testDir, 'tools-cc.json');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.writeJson(configFile, {
      sources: { 'test-source': { skills: ['a'], commands: [], agents: [] } },
      links: ['iflow']
    });
    process.chdir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    vi.restoreAllMocks();
  });

  it('should export project config to default file', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await handleExport({});

    const exportFile = path.join(testDir, '.toolscc-export.json');
    expect(await fs.pathExists(exportFile)).toBe(true);

    const exported = await fs.readJson(exportFile);
    expect(exported.version).toBe('1.0');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Exported'));
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm run test:run tests/commands/export.test.ts
```

Expected: FAIL - 模块未找到

**Step 3: 实现 export 命令**

```typescript
// src/commands/export.ts
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { exportProjectConfig } from '../core/project';
import { loadGlobalConfig } from '../core/config';
import { GLOBAL_CONFIG_DIR } from '../utils/path';

export async function handleExport(options: {
  output?: string;
  global?: boolean;
}): Promise<void> {
  const projectDir = process.cwd();

  if (options.global) {
    // 导出全局配置
    const outputPath = options.output || path.join(projectDir, '.toolscc-global-export.json');
    const config = await loadGlobalConfig(GLOBAL_CONFIG_DIR);

    const exportData = {
      version: '1.0',
      sourcesDir: config.sourcesDir,
      sources: config.sources
    };

    await fs.writeJson(outputPath, exportData, { spaces: 2 });
    console.log(chalk.green(`✓ Exported global config to: ${outputPath}`));
  } else {
    // 导出项目配置
    const outputPath = options.output || path.join(projectDir, '.toolscc-export.json');

    try {
      await exportProjectConfig(projectDir, outputPath);
      console.log(chalk.green(`✓ Exported project config to: ${outputPath}`));
    } catch (error) {
      console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
}
```

**Step 4: 运行测试**

```bash
npm run test:run tests/commands/export.test.ts
```

Expected: PASS

**Step 5: 注册命令到 index.ts**

```typescript
// src/index.ts 添加导入
import { handleExport } from './commands/export';

// src/index.ts 在 program 命令注册部分添加
program
  .command('export')
  .description('Export project or global config')
  .option('-o, --output <file>', 'Output file path')
  .option('--global', 'Export global config')
  .action(async (options) => {
    await handleExport(options);
  });
```

**Step 6: 提交**

```bash
git add src/commands/export.ts tests/commands/export.test.ts src/index.ts
git commit -m "feat(commands): add export command"
```

---

## Task 6: 重构 use 命令支持路径语法和交互选择

**Files:**
- Modify: `src/commands/use.ts`
- Modify: `tests/commands/use.test.ts`

**Step 1: 创建测试文件（如不存在）或添加测试用例**

```typescript
// tests/commands/use.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { handleUse } from '../../src/commands/use';
import { parseSourcePath } from '../../src/utils/parsePath';

describe('Use Command', () => {
  const testDir = path.join(__dirname, '../fixtures/use-cmd-test');
  const sourceDir = path.join(__dirname, '../fixtures/use-source');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(sourceDir, 'skills', 'skill-a'));
    await fs.ensureDir(path.join(sourceDir, 'skills', 'skill-b'));
    await fs.ensureDir(path.join(sourceDir, 'commands'));
    await fs.writeFile(path.join(sourceDir, 'commands', 'test.md'), '# test');
    process.chdir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    await fs.remove(sourceDir);
  });

  describe('parseSourcePath (via command)', () => {
    it('should parse source-only path', () => {
      const result = parseSourcePath('my-source');
      expect(result.sourceName).toBe('my-source');
      expect(result.type).toBeUndefined();
    });

    it('should parse skill path', () => {
      const result = parseSourcePath('my-source/skills/a-skill');
      expect(result.sourceName).toBe('my-source');
      expect(result.type).toBe('skills');
      expect(result.itemName).toBe('a-skill');
    });
  });
});
```

**Step 2: 重构 handleUse 函数**

```typescript
// src/commands/use.ts
import chalk from 'chalk';
import inquirer from 'inquirer';
import { useSource, unuseSource, listUsedSources, initProject, importProjectConfig } from '../core/project';
import { getSourcePath, listSources } from '../core/source';
import { createSymlink, isSymlink } from '../core/symlink';
import { GLOBAL_CONFIG_DIR, getToolsccDir, getProjectConfigPath } from '../utils/path';
import { parseSourcePath, buildSelectionFromPaths } from '../utils/parsePath';
import { scanSource } from '../core/manifest';
import { SourceSelection, normalizeProjectConfig } from '../types/config';
import fs from 'fs-extra';
import path from 'path';

const SUPPORTED_TOOLS: Record<string, string> = {
  iflow: '.iflow',
  claude: '.claude',
  codebuddy: '.codebuddy',
  opencode: '.opencode'
};

interface UseOptions {
  projects?: string[];
  ls?: boolean;
  config?: string;
}

export async function handleUse(
  sourceSpecs: string[],
  options: UseOptions
): Promise<void> {
  const projectDir = process.cwd();
  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);

  // 模式1: 从配置文件导入
  if (options.config) {
    await handleImportFromConfig(options.config, projectDir, options.projects);
    return;
  }

  // 模式2: 交互选择模式 (-ls)
  if (sourceSpecs.length === 1 && options.ls) {
    await handleInteractiveSelect(sourceSpecs[0], projectDir, options.projects);
    return;
  }

  // 模式3: "." 模式 - 使用现有配置重建链接
  const isDotMode = sourceSpecs.length === 1 && sourceSpecs[0] === '.';
  if (isDotMode) {
    await handleDotMode(projectDir, options.projects);
    return;
  }

  // 模式4: 无参数 - 选择源
  if (sourceSpecs.length === 0) {
    sourceSpecs = await selectSourcesInteractively();
    if (sourceSpecs.length === 0) {
      console.log(chalk.gray('No sources selected.'));
      return;
    }
  }

  // 解析路径规格，构建选择配置
  const selectionMap = buildSelectionFromPaths(sourceSpecs);

  // 初始化项目
  await initProject(projectDir);

  // 启用每个配置源
  for (const [sourceName, selection] of Object.entries(selectionMap)) {
    try {
      const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);

      // 判断是否为整源引入（没有指定具体路径）
      const specs = sourceSpecs.filter(s => s === sourceName || s.startsWith(`${sourceName}/`));
      const isWholeSource = specs.length === 1 && specs[0] === sourceName;

      const effectiveSelection = isWholeSource
        ? { skills: ['*'], commands: ['*'], agents: ['*'] }
        : selection;

      await useSource(sourceName, sourcePath, projectDir, effectiveSelection);
      console.log(chalk.green(`✓ Using source: ${sourceName}`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to use ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  // 创建符号链接
  await createToolLinks(projectDir, options.projects);
}

async function handleImportFromConfig(
  configPath: string,
  projectDir: string,
  tools?: string[]
): Promise<void> {
  try {
    await importProjectConfig(configPath, projectDir, async (sourceName) => {
      return await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
    });

    await createToolLinks(projectDir, tools);
    console.log(chalk.green(`✓ Imported config from: ${configPath}`));
  } catch (error) {
    console.log(chalk.red(`✗ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

async function handleInteractiveSelect(
  sourceName: string,
  projectDir: string,
  tools?: string[]
): Promise<void> {
  try {
    const sourcePath = await getSourcePath(sourceName, GLOBAL_CONFIG_DIR);
    const manifest = await scanSource(sourcePath);

    // 构建带分组的选项
    const choices: inquirer.DistinctChoice[] = [];

    if (manifest.skills && manifest.skills.length > 0) {
      choices.push(new inquirer.Separator(chalk.cyan('── Skills ──')));
      choices.push(...manifest.skills.map(s => ({ name: s, value: `skills/${s}` })));
    }

    if (manifest.commands && manifest.commands.length > 0) {
      choices.push(new inquirer.Separator(chalk.cyan('── Commands ──')));
      choices.push(...manifest.commands.map(c => ({ name: c, value: `commands/${c}` })));
    }

    if (manifest.agents && manifest.agents.length > 0) {
      choices.push(new inquirer.Separator(chalk.cyan('── Agents ──')));
      choices.push(...manifest.agents.map(a => ({ name: a, value: `agents/${a}` })));
    }

    if (choices.length === 0) {
      console.log(chalk.yellow(`No items found in source: ${sourceName}`));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: `Select items from ${sourceName}:`,
        choices
      }
    ]);

    if (answers.selected.length === 0) {
      console.log(chalk.gray('No items selected.'));
      return;
    }

    // 转换选择为 SourceSelection
    const selection: SourceSelection = { skills: [], commands: [], agents: [] };
    for (const item of answers.selected as string[]) {
      const [type, name] = item.split('/');
      if (type === 'skills' || type === 'commands' || type === 'agents') {
        selection[type].push(name);
      }
    }

    await initProject(projectDir);
    await useSource(sourceName, sourcePath, projectDir, selection);
    console.log(chalk.green(`✓ Using source: ${sourceName}`));

    await createToolLinks(projectDir, tools);
  } catch (error) {
    console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

async function handleDotMode(projectDir: string, tools?: string[]): Promise<void> {
  const configFile = getProjectConfigPath(projectDir);

  if (!(await fs.pathExists(configFile))) {
    console.log(chalk.yellow('Project not initialized. Run `tools-cc use <source>` first.'));
    return;
  }

  const config = await fs.readJson(configFile);
  const normalized = normalizeProjectConfig(config);
  const sourceNames = Object.keys(normalized.sources);

  if (sourceNames.length === 0) {
    console.log(chalk.yellow('No sources configured in this project.'));
    return;
  }

  console.log(chalk.cyan(`Using existing sources: ${sourceNames.join(', ')}`));
  await createToolLinks(projectDir, tools);
}

async function selectSourcesInteractively(): Promise<string[]> {
  const sources = await listSources(GLOBAL_CONFIG_DIR);
  const sourceList = Object.keys(sources);

  if (sourceList.length === 0) {
    console.log(chalk.yellow('No sources configured. Use `tools-cc -s add` to add one.'));
    return [];
  }

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSources',
      message: 'Select sources to use:',
      choices: sourceList
    }
  ]);

  return answers.selectedSources;
}

async function createToolLinks(projectDir: string, tools?: string[]): Promise<void> {
  const toolsccDir = getToolsccDir(projectDir);
  const configFile = getProjectConfigPath(projectDir);
  const targetTools = tools || Object.keys(SUPPORTED_TOOLS);

  for (const tool of targetTools) {
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

  // 更新项目配置中的 links
  if (await fs.pathExists(configFile)) {
    const config = await fs.readJson(configFile);
    const existingLinks = config.links || [];
    config.links = [...new Set([...existingLinks, ...targetTools])];
    await fs.writeJson(configFile, config, { spaces: 2 });
  }
}

// 导出其他函数保持兼容
export { handleList, handleRemove, handleStatus, handleProjectUpdate } from './use';
```

**Step 3: 更新 index.ts 注册 use 命令新选项**

```typescript
// src/index.ts 修改 use 命令注册
program
  .command('use [sources...]')
  .description('Use sources in current project')
  .option('-p, --projects <tools...>', 'Tools to link (iflow, claude, codebuddy, opencode)')
  .option('-ls', 'Interactive selection mode')
  .option('-c, --config <file>', 'Import from config file')
  .action(async (sources: string[], options) => {
    await handleUse(sources, options);
  });
```

**Step 4: 运行测试**

```bash
npm run test:run tests/commands/use.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/commands/use.ts src/index.ts tests/commands/use.test.ts
git commit -m "feat(commands): refactor use to support path syntax and -ls mode"
```

---

## Task 7: 运行完整测试套件

**Step 1: 运行所有测试**

```bash
npm test
```

Expected: 所有测试通过

**Step 2: 构建项目**

```bash
npm run build
```

Expected: 构建成功

**Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: complete partial import and config export/import feature"
```

---

## 验收清单

- [ ] `tools-cc use my-skills/skills/a-skill` 正确引入单个 skill
- [ ] `tools-cc use my-skills -ls` 显示交互选择界面
- [ ] `tools-cc export` 导出项目配置
- [ ] `tools-cc export --global` 导出全局配置
- [ ] `tools-cc use -c config.json` 从配置文件导入
- [ ] 旧格式项目配置自动转换为新格式
- [ ] 所有测试通过
