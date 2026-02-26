import fs from 'fs-extra';
import path from 'path';
import { Manifest } from '../types';

export async function loadManifest(sourceDir: string): Promise<Manifest> {
  const manifestPath = path.join(sourceDir, 'manifest.json');
  
  if (await fs.pathExists(manifestPath)) {
    try {
      return await fs.readJson(manifestPath);
    } catch (error) {
      throw new Error(`Failed to parse manifest.json: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }
  
  return scanSource(sourceDir);
}

export async function scanSource(sourceDir: string): Promise<Manifest> {
  const name = path.basename(sourceDir);
  const manifest: Manifest = {
    name,
    version: '0.0.0',
    skills: [],
    commands: [],
    agents: []
  };
  
  // Scan skills
  const skillsDir = path.join(sourceDir, 'skills');
  if (await fs.pathExists(skillsDir)) {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    manifest.skills = entries
      .filter(e => e.isDirectory())
      .map(e => e.name);
  }
  
  // Scan commands
  const commandsDir = path.join(sourceDir, 'commands');
  if (await fs.pathExists(commandsDir)) {
    const entries = await fs.readdir(commandsDir, { withFileTypes: true });
    manifest.commands = entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => e.name.replace('.md', ''));
  }
  
  // Scan agents
  const agentsDir = path.join(sourceDir, 'agents');
  if (await fs.pathExists(agentsDir)) {
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    manifest.agents = entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => e.name.replace('.md', ''));
  }
  
  return manifest;
}
