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
