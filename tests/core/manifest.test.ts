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
