import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { saveTemplate, listTemplates, removeTemplate, getTemplate } from '../../src/core/template';
import { TemplateConfig, ProjectConfig } from '../../src/types';

const TEST_DIR = path.join(os.tmpdir(), 'tools-cc-template-test');
const TEMPLATES_DIR = path.join(TEST_DIR, 'templates');

const mockProjectConfig: ProjectConfig = {
  sources: {
    'test-source': {
      skills: ['*'],
      commands: ['*'],
      agents: ['*']
    }
  },
  links: ['iflow']
};

describe('template core', () => {
  beforeEach(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEMPLATES_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('saveTemplate', () => {
    it('should save template with given name', async () => {
      const template = await saveTemplate(
        'my-template',
        '/path/to/project',
        mockProjectConfig,
        TEMPLATES_DIR
      );

      expect(template.name).toBe('my-template');
      expect(template.sourceProject).toBe('/path/to/project');
      expect(template.config).toEqual(mockProjectConfig);

      const saved = await fs.readJson(path.join(TEMPLATES_DIR, 'my-template.json'));
      expect(saved.name).toBe('my-template');
    });

    it('should throw error if template name is empty', async () => {
      await expect(
        saveTemplate('', '/path/to/project', mockProjectConfig, TEMPLATES_DIR)
      ).rejects.toThrow('Template name is required');
    });
  });

  describe('listTemplates', () => {
    it('should return empty array when no templates', async () => {
      const templates = await listTemplates(TEMPLATES_DIR);
      expect(templates).toEqual([]);
    });

    it('should list all templates', async () => {
      await saveTemplate('template-1', '/path/a', mockProjectConfig, TEMPLATES_DIR);
      await saveTemplate('template-2', '/path/b', mockProjectConfig, TEMPLATES_DIR);

      const templates = await listTemplates(TEMPLATES_DIR);
      expect(templates).toHaveLength(2);
      expect(templates.map(t => t.name)).toContain('template-1');
      expect(templates.map(t => t.name)).toContain('template-2');
    });
  });

  describe('getTemplate', () => {
    it('should return template by name', async () => {
      await saveTemplate('my-template', '/path/to/project', mockProjectConfig, TEMPLATES_DIR);

      const template = await getTemplate('my-template', TEMPLATES_DIR);
      expect(template?.name).toBe('my-template');
    });

    it('should return null if template not found', async () => {
      const template = await getTemplate('non-existent', TEMPLATES_DIR);
      expect(template).toBeNull();
    });
  });

  describe('removeTemplate', () => {
    it('should remove template', async () => {
      await saveTemplate('to-remove', '/path', mockProjectConfig, TEMPLATES_DIR);

      await removeTemplate('to-remove', TEMPLATES_DIR);

      const exists = await fs.pathExists(path.join(TEMPLATES_DIR, 'to-remove.json'));
      expect(exists).toBe(false);
    });

    it('should throw error if template not found', async () => {
      await expect(
        removeTemplate('non-existent', TEMPLATES_DIR)
      ).rejects.toThrow('Template not found');
    });
  });
});
