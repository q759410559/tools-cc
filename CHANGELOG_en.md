# Changelog

All notable changes to this project will be documented in this file.

## [1.0.4] - 2026-02-28

### Added
- Added English version of project documentation README_en.md

### Changed
- Optimized project initialization and source synchronization logic

## [1.0.3] - 2026-02-26

### Changed
- Changed project configuration file location from `tools-cc.json` to `.toolscc/config.json`
- Improved documentation command descriptions, clearly distinguishing global and project commands

## [1.0.2] - 2026-02-26

### Added
- Added `tools-cc -s scan` command: scan sourcesDir directory to auto-discover and add configuration sources
- Added `tools-cc -s upgrade [name]` command alias: execute git pull to update configuration source code
- Added `tools-cc update [sources...]` command: sync configuration source content to project .toolscc directory

### Changed
- Improved help documentation, added workflow guide and command comparison table

## [1.0.1] - 2026-02-25

### Added
- Added package.json repository metadata (repository, bugs, homepage)

## [1.0.0] - 2026-02-25

### Added
- Project initialization, built CLI framework based on TypeScript + Commander
- Global configuration management module
  - `tools-cc -c set <key> <value>` set configuration
  - `tools-cc -c get <key>` get configuration
  - `tools-cc config list` view complete configuration
- Configuration source management module
  - `tools-cc -s add <name> <path-or-url>` add configuration source (supports Git URL and local path)
  - `tools-cc -s list` list all configuration sources
  - `tools-cc -s remove <name>` remove configuration source
  - `tools-cc -s update [name]` update configuration source (git pull)
- Project management module
  - `tools-cc use [sources...]` enable configuration sources and create symbolic links
  - `tools-cc list` list enabled configuration sources
  - `tools-cc rm <source>` disable configuration source
  - `tools-cc status` view project status
- Symbolic link management module (supports Windows Junction)
- Manifest loading and scanning module
- Bilingual help information (Chinese/English) (`tools-cc help`)
- Unit test coverage (vitest)

### Supported Tools
| Tool | Link Name |
|------|-----------|
| iflow | `.iflow` |
| claude | `.claude` |
| codebuddy | `.codebuddy` |
| opencode | `.opencode` |

---

## Versioning

- **Major version**: Incompatible API changes
- **Minor version**: Backwards-compatible functionality additions
- **Patch version**: Backwards-compatible bug fixes
