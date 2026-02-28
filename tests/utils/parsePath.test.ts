import { describe, it, expect } from 'vitest';
import { parseSourcePath, buildSelectionFromPaths, ParsedSourcePath } from '../../src/utils/parsePath';
import { SourceSelection } from '../../src/types/config';

describe('parseSourcePath', () => {
  describe('whole source', () => {
    it('should parse source name only', () => {
      const result = parseSourcePath('my-skills');
      expect(result).toEqual({
        sourceName: 'my-skills'
      });
    });

    it('should parse source name with hyphens', () => {
      const result = parseSourcePath('my-awesome-skills');
      expect(result).toEqual({
        sourceName: 'my-awesome-skills'
      });
    });

    it('should parse source name with underscores', () => {
      const result = parseSourcePath('my_skills_repo');
      expect(result).toEqual({
        sourceName: 'my_skills_repo'
      });
    });
  });

  describe('specific skill', () => {
    it('should parse skill path', () => {
      const result = parseSourcePath('my-skills/skills/a-skill');
      expect(result).toEqual({
        sourceName: 'my-skills',
        type: 'skills',
        itemName: 'a-skill'
      });
    });

    it('should parse skill path with underscores', () => {
      const result = parseSourcePath('my-skills/skills/my_awesome_skill');
      expect(result).toEqual({
        sourceName: 'my-skills',
        type: 'skills',
        itemName: 'my_awesome_skill'
      });
    });
  });

  describe('specific command', () => {
    it('should parse command path', () => {
      const result = parseSourcePath('my-skills/commands/test');
      expect(result).toEqual({
        sourceName: 'my-skills',
        type: 'commands',
        itemName: 'test'
      });
    });

    it('should parse command path with hyphens', () => {
      const result = parseSourcePath('tools/commands/my-command');
      expect(result).toEqual({
        sourceName: 'tools',
        type: 'commands',
        itemName: 'my-command'
      });
    });
  });

  describe('specific agent', () => {
    it('should parse agent path', () => {
      const result = parseSourcePath('other/agents/reviewer');
      expect(result).toEqual({
        sourceName: 'other',
        type: 'agents',
        itemName: 'reviewer'
      });
    });
  });

  describe('invalid paths', () => {
    it('should return sourceName only for invalid type', () => {
      const result = parseSourcePath('my-skills/invalid/item');
      expect(result).toEqual({
        sourceName: 'my-skills'
      });
    });

    it('should return sourceName only for incomplete path', () => {
      const result = parseSourcePath('my-skills/skills');
      expect(result).toEqual({
        sourceName: 'my-skills'
      });
    });

    it('should handle empty string', () => {
      const result = parseSourcePath('');
      expect(result).toEqual({
        sourceName: ''
      });
    });

    it('should handle path with too many segments', () => {
      const result = parseSourcePath('my-skills/skills/a/b/c');
      expect(result).toEqual({
        sourceName: 'my-skills',
        type: 'skills',
        itemName: 'a'
      });
    });
  });
});

describe('buildSelectionFromPaths', () => {
  it('should build selection from single skill path', () => {
    const paths = ['my-skills/skills/a-skill'];
    const result = buildSelectionFromPaths(paths);
    
    expect(result).toEqual({
      'my-skills': {
        skills: ['a-skill'],
        commands: [],
        agents: []
      }
    });
  });

  it('should build selection from multiple skills in same source', () => {
    const paths = ['my-skills/skills/a', 'my-skills/skills/b'];
    const result = buildSelectionFromPaths(paths);
    
    expect(result).toEqual({
      'my-skills': {
        skills: ['a', 'b'],
        commands: [],
        agents: []
      }
    });
  });

  it('should build selection from mixed types', () => {
    const paths = [
      'my-skills/skills/a',
      'my-skills/skills/b',
      'my-skills/commands/test'
    ];
    const result = buildSelectionFromPaths(paths);
    
    expect(result).toEqual({
      'my-skills': {
        skills: ['a', 'b'],
        commands: ['test'],
        agents: []
      }
    });
  });

  it('should build selection from multiple sources', () => {
    const paths = [
      'source-a/skills/skill1',
      'source-b/commands/cmd1',
      'source-b/agents/agent1'
    ];
    const result = buildSelectionFromPaths(paths);
    
    expect(result).toEqual({
      'source-a': {
        skills: ['skill1'],
        commands: [],
        agents: []
      },
      'source-b': {
        skills: [],
        commands: ['cmd1'],
        agents: ['agent1']
      }
    });
  });

  it('should handle whole source path (no type/item)', () => {
    const paths = ['my-skills'];
    const result = buildSelectionFromPaths(paths);
    
    expect(result).toEqual({
      'my-skills': {
        skills: ['*'],
        commands: ['*'],
        agents: ['*']
      }
    });
  });

  it('should handle mixed whole and partial source paths', () => {
    const paths = [
      'source-a',
      'source-b/skills/skill1',
      'source-b/commands/cmd1'
    ];
    const result = buildSelectionFromPaths(paths);
    
    expect(result).toEqual({
      'source-a': {
        skills: ['*'],
        commands: ['*'],
        agents: ['*']
      },
      'source-b': {
        skills: ['skill1'],
        commands: ['cmd1'],
        agents: []
      }
    });
  });

  it('should handle empty array', () => {
    const result = buildSelectionFromPaths([]);
    expect(result).toEqual({});
  });

  it('should deduplicate items', () => {
    const paths = [
      'my-skills/skills/a',
      'my-skills/skills/a',
      'my-skills/skills/b'
    ];
    const result = buildSelectionFromPaths(paths);
    
    expect(result).toEqual({
      'my-skills': {
        skills: ['a', 'b'],
        commands: [],
        agents: []
      }
    });
  });
});
