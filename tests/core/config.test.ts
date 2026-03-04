import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadGlobalConfig, saveGlobalConfig } from '../../src/core/config';

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
