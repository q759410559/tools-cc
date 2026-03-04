import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { ExportConfig } from '../../src/types/config';

// Mock inquirer to avoid interactive prompts in tests
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  }
}));

import inquirer from 'inquirer';

describe('handleUse Command - parseSourcePath', () => {
  it('should parse full path with type and item', async () => {
    const { parseSourcePath } = await import('../../src/utils/parsePath');

    const result = parseSourcePath('my-skills/skills/a-skill');
    expect(result).toEqual({
      sourceName: 'my-skills',
      type: 'skills',
      itemName: 'a-skill'
    });
  });

  it('should parse source name only', async () => {
    const { parseSourcePath } = await import('../../src/utils/parsePath');

    const result = parseSourcePath('my-skills');
    expect(result).toEqual({
      sourceName: 'my-skills'
    });
  });

  it('should parse commands path', async () => {
    const { parseSourcePath } = await import('../../src/utils/parsePath');

    const result = parseSourcePath('my-source/commands/test-cmd');
    expect(result).toEqual({
      sourceName: 'my-source',
      type: 'commands',
      itemName: 'test-cmd'
    });
  });

  it('should parse agents path', async () => {
    const { parseSourcePath } = await import('../../src/utils/parsePath');

    const result = parseSourcePath('my-source/agents/reviewer');
    expect(result).toEqual({
      sourceName: 'my-source',
      type: 'agents',
      itemName: 'reviewer'
    });
  });

  it('should handle invalid type gracefully', async () => {
    const { parseSourcePath } = await import('../../src/utils/parsePath');

    const result = parseSourcePath('my-source/invalid/item');
    expect(result).toEqual({
      sourceName: 'my-source'
    });
  });

  it('should handle empty string', async () => {
    const { parseSourcePath } = await import('../../src/utils/parsePath');

    const result = parseSourcePath('');
    expect(result).toEqual({
      sourceName: ''
    });
  });

  it('should handle path without item name', async () => {
    const { parseSourcePath } = await import('../../src/utils/parsePath');

    const result = parseSourcePath('my-source/skills');
    expect(result).toEqual({
      sourceName: 'my-source'
    });
  });
});

describe('handleUse Command - buildSelectionFromPaths', () => {
  it('should build selection from multiple paths', async () => {
    const { buildSelectionFromPaths } = await import('../../src/utils/parsePath');

    const result = buildSelectionFromPaths([
      'my-skills/skills/a-skill',
      'my-skills/skills/b-skill',
      'my-skills/commands/test-cmd'
    ]);

    expect(result).toEqual({
      'my-skills': {
        skills: ['a-skill', 'b-skill'],
        commands: ['test-cmd'],
        agents: []
      }
    });
  });

  it('should use wildcard for whole source', async () => {
    const { buildSelectionFromPaths } = await import('../../src/utils/parsePath');

    const result = buildSelectionFromPaths(['my-skills']);

    expect(result).toEqual({
      'my-skills': {
        skills: ['*'],
        commands: ['*'],
        agents: ['*']
      }
    });
  });

  it('should handle multiple sources', async () => {
    const { buildSelectionFromPaths } = await import('../../src/utils/parsePath');

    const result = buildSelectionFromPaths([
      'source-a/skills/skill1',
      'source-b/commands/cmd1'
    ]);

    expect(result).toEqual({
      'source-a': {
        skills: ['skill1'],
        commands: [],
        agents: []
      },
      'source-b': {
        skills: [],
        commands: ['cmd1'],
        agents: []
      }
    });
  });

  it('should deduplicate items', async () => {
    const { buildSelectionFromPaths } = await import('../../src/utils/parsePath');

    const result = buildSelectionFromPaths([
      'my-skills/skills/a-skill',
      'my-skills/skills/a-skill', // duplicate
    ]);

    expect(result['my-skills'].skills).toEqual(['a-skill']);
    expect(result['my-skills'].skills.length).toBe(1);
  });

  it('should handle empty array', async () => {
    const { buildSelectionFromPaths } = await import('../../src/utils/parsePath');

    const result = buildSelectionFromPaths([]);
    expect(result).toEqual({});
  });

  it('should handle mixed whole-source and partial paths', async () => {
    const { buildSelectionFromPaths } = await import('../../src/utils/parsePath');

    // When whole source is specified, it should override partial selections
    const result = buildSelectionFromPaths([
      'my-skills/skills/a-skill',
      'my-skills', // whole source should overwrite
    ]);

    expect(result['my-skills']).toEqual({
      skills: ['*'],
      commands: ['*'],
      agents: ['*']
    });
  });
});

describe('handleUse Command - integration tests', () => {
  // Use unique directory for each test to avoid conflicts
  let testId = 0;
  const getTestDir = (name: string) => path.join(__dirname, '../fixtures', `use-test-${testId}-${name}`);

  beforeEach(() => {
    testId++;
  });

  afterEach(async () => {
    // Cleanup all test directories
    for (let i = 1; i <= testId; i++) {
      try {
        await fs.remove(path.join(__dirname, '../fixtures', `use-test-${i}-project`));
        await fs.remove(path.join(__dirname, '../fixtures', `use-test-${i}-source`));
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('should handle dot mode on non-initialized project', async () => {
    const projectDir = getTestDir('project');
    await fs.ensureDir(projectDir);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const originalCwd = process.cwd();
    process.chdir(projectDir);

    try {
      const { handleUse } = await import('../../src/commands/use');
      await handleUse(['.'], {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Project not initialized')
      );
    } finally {
      process.chdir(originalCwd);
      consoleLogSpy.mockRestore();
      await fs.remove(projectDir);
    }
  });

  it('should handle dot mode with initialized project', async () => {
    const projectDir = getTestDir('project');
    const sourceDir = getTestDir('source');

    await fs.ensureDir(projectDir);
    await fs.ensureDir(path.join(sourceDir, 'skills', 'test-skill'));
    await fs.writeFile(path.join(sourceDir, 'skills', 'test-skill', 'test.md'), '# test');

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const originalCwd = process.cwd();
    process.chdir(projectDir);

    try {
      const { initProject, useSource } = await import('../../src/core/project');
      const { handleUse } = await import('../../src/commands/use');

      // Initialize and add a source
      await initProject(projectDir);
      await useSource('test-source', sourceDir, projectDir);

      // Now use dot mode
      await handleUse(['.'], {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using existing sources')
      );
    } finally {
      process.chdir(originalCwd);
      consoleLogSpy.mockRestore();
      await fs.remove(projectDir);
      await fs.remove(sourceDir);
    }
  });

  it('should handle config import mode', async () => {
    const projectDir = getTestDir('project');
    const sourceDir = getTestDir('source');
    const configPath = getTestDir('import-config.json');

    await fs.ensureDir(projectDir);
    await fs.ensureDir(path.join(sourceDir, 'skills', 'test-skill'));
    await fs.writeFile(path.join(sourceDir, 'skills', 'test-skill', 'test.md'), '# test');

    // Create export config
    const exportConfig: ExportConfig = {
      version: '1.0',
      type: 'project',
      config: {
        sources: {
          'imported-source': {
            skills: ['test-skill'],
            commands: [],
            agents: []
          }
        },
        links: []
      },
      exportedAt: new Date().toISOString()
    };
    await fs.writeJson(configPath, exportConfig, { spaces: 2 });

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const originalCwd = process.cwd();
    process.chdir(projectDir);

    try {
      const { initProject } = await import('../../src/core/project');
      const { handleUse } = await import('../../src/commands/use');

      await initProject(projectDir);

      // Mock the getSourcePath to return our test source
      const originalGetSourcePath = (await import('../../src/core/source')).getSourcePath;
      vi.mock('../../src/core/source', async (importOriginal) => {
        const mod = await importOriginal();
        return {
          ...mod,
          getSourcePath: async (name: string) => {
            if (name === 'imported-source') return sourceDir;
            return originalGetSourcePath(name, '');
          }
        };
      });

      // Direct test of importProjectConfig
      const { importProjectConfig } = await import('../../src/core/project');
      await importProjectConfig(configPath, projectDir, async (name) => {
        if (name === 'imported-source') return sourceDir;
        throw new Error(`Unknown source: ${name}`);
      });

      // Verify config was imported
      const config = await fs.readJson(path.join(projectDir, '.toolscc', 'config.json'));
      expect(config.sources['imported-source']).toBeDefined();

    } finally {
      process.chdir(originalCwd);
      consoleLogSpy.mockRestore();
      await fs.remove(projectDir);
      await fs.remove(sourceDir);
      await fs.remove(configPath);
    }
  });
});