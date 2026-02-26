# tools-cc

A CLI tool for unified management of skills/commands/agents configurations across multiple AI programming tools (iflow, claude, codebuddy, opencode, etc.). Uses symbolic links to avoid duplicate configurations across tools.

## Installation

```bash
# Install from npm
npm install -g tools-cc

# Or build from source
git clone https://github.com/q759410559/tools-cc.git
cd tools-cc
npm install
npm run build
npm link
```

## Quick Start

```bash
# 1. Set configuration source storage location (optional, default is ~/.tools-cc/sources)
tools-cc -c set sourcesDir D:/skills-hub-sources

# 2. Add configuration sources (supports Git URL or local path)
tools-cc -s add my-skills https://github.com/user/my-skills.git
tools-cc -s add local-skills D:/path/to/local-skills

# Or scan source directory to auto-discover and add configurations
tools-cc -s scan

# 3. View added configuration sources
tools-cc -s list

# 4. Enable configuration sources in a project and create links
cd my-project
tools-cc use my-skills -p iflow claude

# 5. View project status
tools-cc status

# 6. View enabled configuration sources
tools-cc list

# 7. Update configuration sources (sync latest content from source directory to project)
tools-cc update my-skills
tools-cc update              # Update all

# 8. Remove configuration source
tools-cc rm my-skills
```

## Workflow Guide

### Global Source Management vs Project Configuration

| Command | Scope | Description |
|---------|-------|-------------|
| `tools-cc -s add/remove/list` | Global | Manage global configuration sources |
| `tools-cc -s update/upgrade` | Global | git pull to update source code |
| `tools-cc -s scan` | Global | Scan directory to discover new sources |
| `tools-cc use/rm` | Project | Enable/disable sources in project |
| `tools-cc update` | Project | Sync source content to project |

### Typical Workflow

```bash
# Scenario 1: Configuration source has updates, need to sync to project
tools-cc -s upgrade my-skills    # 1. git pull to update source code
cd my-project
tools-cc update my-skills        # 2. Sync to project .toolscc directory

# Scenario 2: Batch update all sources
tools-cc -s upgrade              # 1. Update all git sources
cd my-project
tools-cc update                  # 2. Sync all sources to project
```

## Command Reference

### Source Management

```bash
# Shortcuts (-s)
tools-cc -s add <name> <path-or-url>     # Add configuration source (Git URL or local path)
tools-cc -s list                          # List all configuration sources (alias: -s ls)
tools-cc -s remove <name>                 # Remove configuration source (alias: -s rm)
tools-cc -s update [name]                 # git pull to update source code (alias: -s up, -s upgrade)
tools-cc -s scan                          # Scan sourcesDir to auto-discover and add configuration sources

# Full commands (sources)
tools-cc sources add <name> <path-or-url> # Add configuration source
tools-cc sources list                     # List all configuration sources (alias: sources ls)
tools-cc sources remove <name>            # Remove configuration source (alias: sources rm)
tools-cc sources update [name]            # git pull to update source code (alias: sources up, sources upgrade)
tools-cc sources scan                     # Scan sourcesDir to auto-discover and add configuration sources
```

### Project Configuration

```bash
tools-cc use [sources...] [-p tools...]   # Enable configuration sources and create symbolic links
tools-cc update [sources...]              # Sync configuration source content to project .toolscc directory
tools-cc list                             # List enabled configuration sources
tools-cc rm <source>                      # Disable configuration source
tools-cc status                           # View project status
```

### Config Management

```bash
# Shortcuts (-c)
tools-cc -c set <key> <value>             # Set configuration
tools-cc -c get <key>                     # Get configuration

# Full commands (config)
tools-cc config set <key> <value>         # Set configuration
tools-cc config get <key>                 # Get configuration
tools-cc config list                      # View complete global configuration
```

### Help

```bash
tools-cc help                             # Display bilingual help (Chinese/English)
tools-cc --help                           # Display command line help
tools-cc --version                        # Display version number
```

## Supported Tools

| Tool | Link Name |
|------|-----------|
| iflow | `.iflow` |
| claude | `.claude` |
| codebuddy | `.codebuddy` |
| opencode | `.opencode` |

## Configuration Source Structure

A configuration source directory should contain the following structure:

```
my-skills/
├── manifest.json          # Optional, describes component information
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── commands/
│   └── my-command.md
└── agents/
    └── my-agent.md
```

### manifest.json Format

```json
{
  "name": "my-skills",
  "version": "1.0.0",
  "skills": ["my-skill"],
  "commands": ["my-command"],
  "agents": ["my-agent"]
}
```

If `manifest.json` is not present, the CLI will automatically scan the directory structure to generate one.

## Project Structure

After using `tools-cc use`, the project directory structure:

```
my-project/
├── .toolscc/                     # Actual content directory
│   ├── config.json               # Project configuration
│   ├── skills/                   # Flattened, with source prefix
│   │   └── my-skills-my-skill/
│   ├── commands/
│   │   └── my-skills/
│   └── agents/
│       └── my-skills/
├── .iflow -> .toolscc            # Symbolic link
└── .claude -> .toolscc
```

## Configuration Files

### Global Configuration `~/.tools-cc/config.json`

```json
{
  "sourcesDir": "D:/skills-hub-sources",
  "sources": {
    "my-skills": {
      "type": "git",
      "url": "https://github.com/user/my-skills.git"
    },
    "local-skills": {
      "type": "local",
      "path": "D:/local-skills"
    }
  }
}
```

### Project Configuration `project/.toolscc/config.json`

```json
{
  "sources": ["my-skills"],
  "links": ["iflow", "claude"]
}
```

## License

MIT
