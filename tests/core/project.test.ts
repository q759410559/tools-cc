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
