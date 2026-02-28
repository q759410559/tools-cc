import { describe, it, expect } from 'vitest';
import {
  isSourceSelection,
  normalizeProjectConfig,
  SourceSelection,
  ProjectConfig,
  LegacyProjectConfig,
  ExportConfig,
  GlobalExportConfig
} from '../../src/types/config';

describe('SourceSelection', () => {
  describe('isSourceSelection', () => {
    it('should return true for valid SourceSelection object', () => {
      const valid: SourceSelection = {
        skills: ['skill1'],
        commands: ['cmd1'],
        agents: ['agent1']
      };
      expect(isSourceSelection(valid)).toBe(true);
    });

    it('should return true for empty arrays', () => {
      const empty: SourceSelection = {
        skills: [],
        commands: [],
        agents: []
      };
      expect(isSourceSelection(empty)).toBe(true);
    });

    it('should return true for wildcard selection', () => {
      const wildcard: SourceSelection = {
        skills: ['*'],
        commands: ['*'],
        agents: ['*']
      };
      expect(isSourceSelection(wildcard)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isSourceSelection(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isSourceSelection(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isSourceSelection('string')).toBe(false);
      expect(isSourceSelection(123)).toBe(false);
      expect(isSourceSelection(true)).toBe(false);
    });

    it('should return false for object missing skills', () => {
      const invalid = {
        commands: ['cmd1'],
        agents: ['agent1']
      };
      expect(isSourceSelection(invalid)).toBe(false);
    });

    it('should return false for object missing commands', () => {
      const invalid = {
        skills: ['skill1'],
        agents: ['agent1']
      };
      expect(isSourceSelection(invalid)).toBe(false);
    });

    it('should return false for object missing agents', () => {
      const invalid = {
        skills: ['skill1'],
        commands: ['cmd1']
      };
      expect(isSourceSelection(invalid)).toBe(false);
    });

    it('should return false for object with non-array skills', () => {
      const invalid = {
        skills: 'not-array',
        commands: ['cmd1'],
        agents: ['agent1']
      };
      expect(isSourceSelection(invalid)).toBe(false);
    });

    it('should return false for object with non-array commands', () => {
      const invalid = {
        skills: ['skill1'],
        commands: 123,
        agents: ['agent1']
      };
      expect(isSourceSelection(invalid)).toBe(false);
    });

    it('should return false for object with non-array agents', () => {
      const invalid = {
        skills: ['skill1'],
        commands: ['cmd1'],
        agents: null
      };
      expect(isSourceSelection(invalid)).toBe(false);
    });
  });
});

describe('normalizeProjectConfig', () => {
  describe('LegacyProjectConfig conversion', () => {
    it('should convert legacy string array sources to Record format', () => {
      const legacy: LegacyProjectConfig = {
        sources: ['source1', 'source2'],
        links: ['iflow', 'claude']
      };

      const result = normalizeProjectConfig(legacy);

      expect(result.sources).toEqual({
        source1: { skills: ['*'], commands: ['*'], agents: ['*'] },
        source2: { skills: ['*'], commands: ['*'], agents: ['*'] }
      });
      expect(result.links).toEqual(['iflow', 'claude']);
    });

    it('should handle empty legacy sources array', () => {
      const legacy: LegacyProjectConfig = {
        sources: [],
        links: []
      };

      const result = normalizeProjectConfig(legacy);

      expect(result.sources).toEqual({});
      expect(result.links).toEqual([]);
    });

    it('should preserve links from legacy config', () => {
      const legacy: LegacyProjectConfig = {
        sources: ['source1'],
        links: ['iflow', 'claude', 'codebuddy']
      };

      const result = normalizeProjectConfig(legacy);

      expect(result.links).toEqual(['iflow', 'claude', 'codebuddy']);
    });
  });

  describe('ProjectConfig passthrough', () => {
    it('should return ProjectConfig as-is when already in new format', () => {
      const newConfig: ProjectConfig = {
        sources: {
          source1: { skills: ['skill1'], commands: ['cmd1'], agents: ['agent1'] }
        },
        links: ['iflow']
      };

      const result = normalizeProjectConfig(newConfig);

      expect(result).toEqual(newConfig);
    });

    it('should handle partial selection in new format', () => {
      const newConfig: ProjectConfig = {
        sources: {
          source1: { skills: ['skill1', 'skill2'], commands: [], agents: ['*'] }
        },
        links: ['claude']
      };

      const result = normalizeProjectConfig(newConfig);

      expect(result).toEqual(newConfig);
    });

    it('should handle multiple sources with different selections', () => {
      const newConfig: ProjectConfig = {
        sources: {
          source1: { skills: ['*'], commands: ['*'], agents: ['*'] },
          source2: { skills: ['skill-a'], commands: [], agents: ['agent-x'] }
        },
        links: ['iflow', 'opencode']
      };

      const result = normalizeProjectConfig(newConfig);

      expect(result).toEqual(newConfig);
    });
  });
});

describe('ExportConfig', () => {
  describe('type structure', () => {
    it('should allow creating ExportConfig with project config', () => {
      const exportConfig: ExportConfig = {
        version: '1.0.0',
        type: 'project',
        config: {
          sources: {
            source1: { skills: ['*'], commands: ['*'], agents: ['*'] }
          },
          links: ['iflow']
        },
        exportedAt: '2026-02-28T00:00:00Z'
      };

      expect(exportConfig.type).toBe('project');
      expect(exportConfig.version).toBe('1.0.0');
    });
  });
});

describe('GlobalExportConfig', () => {
  describe('type structure', () => {
    it('should allow creating GlobalExportConfig with global config', () => {
      const globalExportConfig: GlobalExportConfig = {
        version: '1.0.0',
        type: 'global',
        config: {
          sourcesDir: '~/.tools-cc/sources',
          sources: {
            source1: { type: 'git', url: 'https://github.com/example/skills' }
          }
        },
        exportedAt: '2026-02-28T00:00:00Z'
      };

      expect(globalExportConfig.type).toBe('global');
      expect(globalExportConfig.config.sourcesDir).toBe('~/.tools-cc/sources');
    });
  });
});
