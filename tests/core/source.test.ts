import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { addSource, listSources, removeSource, updateSource, getSourcePath } from '../../src/core/source';

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

  describe('updateSource', () => {
    it('should throw error when source not found', async () => {
      await expect(updateSource('non-existent', testConfigDir)).rejects.toThrow('Source not found: non-existent');
    });

    it('should skip update for local source', async () => {
      await addSource('local-source', testSourcesDir, testConfigDir);
      const consoleSpy = vi.spyOn(console, 'log');
      await updateSource('local-source', testConfigDir);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('is local, no update needed'));
      consoleSpy.mockRestore();
    });
  });

  describe('getSourcePath', () => {
    it('should throw error when source not found', async () => {
      await expect(getSourcePath('non-existent', testConfigDir)).rejects.toThrow('Source not found: non-existent');
    });

    it('should return path for local source', async () => {
      await addSource('local-path-test', testSourcesDir, testConfigDir);
      const result = await getSourcePath('local-path-test', testConfigDir);
      expect(result).toBe(testSourcesDir);
    });
  });

  describe('error handling', () => {
    it('should throw error when adding non-existent local path', async () => {
      const nonExistentPath = path.join(__dirname, 'non-existent-path');
      await expect(addSource('invalid', nonExistentPath, testConfigDir)).rejects.toThrow('Path does not exist');
    });

    it('should throw error when removing non-existent source', async () => {
      await expect(removeSource('non-existent', testConfigDir)).rejects.toThrow('Source not found: non-existent');
    });
  });
});
