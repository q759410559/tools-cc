import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { handleExport } from '../../src/commands/export';
import { initProject, useSource } from '../../src/core/project';
import { GLOBAL_CONFIG_DIR } from '../../src/utils/path';

describe('handleExport', () => {
  const testProjectDir = path.join(__dirname, '../fixtures/test-export-cmd-project');
  const testSourceDir = path.join(__dirname, '../fixtures/test-export-cmd-source');
  const exportFilePath = path.join(__dirname, '../fixtures/test-export-cmd.json');
  const globalExportPath = path.join(__dirname, '../fixtures/test-global-export-cmd.json');

  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Create test source
    await fs.ensureDir(path.join(testSourceDir, 'skills', 'test-skill'));
    await fs.writeFile(path.join(testSourceDir, 'skills', 'test-skill', 'test.md'), '# test skill');

    // Create project directory
    await fs.ensureDir(testProjectDir);

    // Spy on console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.remove(testProjectDir);
    await fs.remove(testSourceDir);
    await fs.remove(exportFilePath);
    await fs.remove(globalExportPath);
    consoleLogSpy.mockRestore();
  });

  it('should export project config to default path', async () => {
    // Initialize project with a source
    await initProject(testProjectDir);
    await useSource('test-source', testSourceDir, testProjectDir);

    // Change to project directory for the test
    const originalCwd = process.cwd();
    process.chdir(testProjectDir);

    try {
      await handleExport({});

      // Check default export file was created
      const defaultExportPath = path.join(testProjectDir, '.toolscc-export.json');
      expect(await fs.pathExists(defaultExportPath)).toBe(true);

      // Verify file content
      const exported = await fs.readJson(defaultExportPath);
      expect(exported.version).toBe('1.0');
      expect(exported.type).toBe('project');

      // Verify console output
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✓ Project config exported to:')
      );

      // Cleanup
      await fs.remove(defaultExportPath);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should export project config to custom path', async () => {
    await initProject(testProjectDir);
    await useSource('test-source', testSourceDir, testProjectDir);

    const originalCwd = process.cwd();
    process.chdir(testProjectDir);

    try {
      await handleExport({ output: exportFilePath });

      expect(await fs.pathExists(exportFilePath)).toBe(true);

      const exported = await fs.readJson(exportFilePath);
      expect(exported.version).toBe('1.0');
      expect(exported.type).toBe('project');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should export global config with --global flag', async () => {
    const originalCwd = process.cwd();
    process.chdir(testProjectDir);

    try {
      await handleExport({ global: true, output: globalExportPath });

      expect(await fs.pathExists(globalExportPath)).toBe(true);

      const exported = await fs.readJson(globalExportPath);
      expect(exported.version).toBe('1.0');
      expect(exported.type).toBe('global');
      expect(exported.config).toBeDefined();
      expect(exported.config.sourcesDir).toBeDefined();
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should throw error when exporting non-initialized project', async () => {
    const originalCwd = process.cwd();
    process.chdir(testProjectDir);

    try {
      // Don't initialize project
      await expect(handleExport({ output: exportFilePath }))
        .rejects.toThrow();
    } finally {
      process.chdir(originalCwd);
    }
  });
});
