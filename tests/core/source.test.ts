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
