import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { initProject, useSource, unuseSource, listUsedSources } from '../../src/core/project';
import { SourceSelection } from '../../src/types/config';

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
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'config.json'))).toBe(true);
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
    
    const config = await fs.readJson(path.join(testProjectDir, '.toolscc', 'config.json'));
    expect(config.sources).not.toHaveProperty('test-source');
  });

  it('should list used sources', async () => {
    await initProject(testProjectDir);
    await useSource('test-source', testSourceDir, testProjectDir);
    
    const sources = await listUsedSources(testProjectDir);
    expect(sources).toContain('test-source');
  });
});

describe('Partial Import', () => {
  const testProjectDir = path.join(__dirname, '../fixtures/test-partial-project');
  const testSourceDir = path.join(__dirname, '../fixtures/test-partial-source');

  beforeEach(async () => {
    // Create test source with multiple skills, commands, and agents
    await fs.ensureDir(path.join(testSourceDir, 'skills', 'skill-a'));
    await fs.ensureDir(path.join(testSourceDir, 'skills', 'skill-b'));
    await fs.ensureDir(path.join(testSourceDir, 'skills', 'skill-c'));
    await fs.ensureDir(path.join(testSourceDir, 'commands'));
    await fs.ensureDir(path.join(testSourceDir, 'agents'));
    
    // Create command files
    await fs.writeFile(path.join(testSourceDir, 'commands', 'cmd1.md'), '# cmd1');
    await fs.writeFile(path.join(testSourceDir, 'commands', 'cmd2.md'), '# cmd2');
    await fs.writeFile(path.join(testSourceDir, 'commands', 'cmd3.md'), '# cmd3');
    
    // Create agent files
    await fs.writeFile(path.join(testSourceDir, 'agents', 'agent1.md'), '# agent1');
    await fs.writeFile(path.join(testSourceDir, 'agents', 'agent2.md'), '# agent2');
    
    // Create skill files
    await fs.writeFile(path.join(testSourceDir, 'skills', 'skill-a', 'test.md'), '# skill-a');
    await fs.writeFile(path.join(testSourceDir, 'skills', 'skill-b', 'test.md'), '# skill-b');
    await fs.writeFile(path.join(testSourceDir, 'skills', 'skill-c', 'test.md'), '# skill-c');
  });

  afterEach(async () => {
    await fs.remove(testProjectDir);
    await fs.remove(testSourceDir);
  });

  it('should import only selected skills', async () => {
    await initProject(testProjectDir);
    
    const selection: SourceSelection = {
      skills: ['skill-a', 'skill-c'],
      commands: [],
      agents: []
    };
    
    await useSource('partial-source', testSourceDir, testProjectDir, selection);
    
    // Should copy selected skills
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'partial-source-skill-a'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'partial-source-skill-c'))).toBe(true);
    
    // Should NOT copy skill-b
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'partial-source-skill-b'))).toBe(false);
    
    // Should NOT copy any commands or agents (empty selection)
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'commands', 'partial-source'))).toBe(false);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'agents', 'partial-source'))).toBe(false);
  });

  it('should import all when selection contains wildcard', async () => {
    await initProject(testProjectDir);
    
    const selection: SourceSelection = {
      skills: ['*'],
      commands: ['*'],
      agents: ['*']
    };
    
    await useSource('wildcard-source', testSourceDir, testProjectDir, selection);
    
    // Should copy all skills
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'wildcard-source-skill-a'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'wildcard-source-skill-b'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'wildcard-source-skill-c'))).toBe(true);
    
    // Should copy all commands
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'commands', 'wildcard-source', 'cmd1.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'commands', 'wildcard-source', 'cmd2.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'commands', 'wildcard-source', 'cmd3.md'))).toBe(true);
    
    // Should copy all agents
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'agents', 'wildcard-source', 'agent1.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'agents', 'wildcard-source', 'agent2.md'))).toBe(true);
  });

  it('should import only selected commands and agents', async () => {
    await initProject(testProjectDir);
    
    const selection: SourceSelection = {
      skills: [],
      commands: ['cmd1', 'cmd3'],
      agents: ['agent2']
    };
    
    await useSource('partial-cmd-agent', testSourceDir, testProjectDir, selection);
    
    // Should NOT copy any skills
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'partial-cmd-agent-skill-a'))).toBe(false);
    
    // Should copy selected commands
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'commands', 'partial-cmd-agent', 'cmd1.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'commands', 'partial-cmd-agent', 'cmd3.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'commands', 'partial-cmd-agent', 'cmd2.md'))).toBe(false);
    
    // Should copy selected agents
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'agents', 'partial-cmd-agent', 'agent2.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'agents', 'partial-cmd-agent', 'agent1.md'))).toBe(false);
  });

  it('should save selection to project config', async () => {
    await initProject(testProjectDir);
    
    const selection: SourceSelection = {
      skills: ['skill-a'],
      commands: ['cmd1'],
      agents: ['agent1']
    };
    
    await useSource('config-source', testSourceDir, testProjectDir, selection);
    
    const config = await fs.readJson(path.join(testProjectDir, '.toolscc', 'config.json'));
    expect(config.sources['config-source']).toEqual(selection);
  });

  it('should default to wildcard when no selection provided', async () => {
    await initProject(testProjectDir);
    
    // Call without selection parameter
    await useSource('default-source', testSourceDir, testProjectDir);
    
    // Should copy all items (default wildcard behavior)
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'default-source-skill-a'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'default-source-skill-b'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.toolscc', 'skills', 'default-source-skill-c'))).toBe(true);
    
    // Config should have wildcard selection
    const config = await fs.readJson(path.join(testProjectDir, '.toolscc', 'config.json'));
    expect(config.sources['default-source']).toEqual({
      skills: ['*'],
      commands: ['*'],
      agents: ['*']
    });
  });
});