# 变更日志

本项目的所有重要变更都将记录在此文件中。

## [1.0.7] - 2026-03-02

### Fixed
- 修复 `tools-cc update` 命令无法正确识别旧版数组格式配置的问题（sources 为数组时会被错误解析为索引）

### Changed
- 更新帮助文档，完善命令说明和示例

## [1.0.6] - 2026-03-02

### Added
- 新增无参数交互式源选择：`tools-cc use` 直接运行显示源列表供选择
- 新增配置文件导入功能：`tools-cc use -c config.json` 从导出的配置文件快速恢复项目配置

### Changed
- 重构 `use` 命令，统一支持多种模式（配置导入、交互选择、路径语法、整体导入、点模式）
- 优化交互选择模式，支持分组展示 skills/commands/agents

## [1.0.5] - 2026-02-28

### Added
- 新增部分导入功能：支持路径语法选择特定的 skills/commands/agents
  - `tools-cc use source:skills/xxx` 只导入指定 skill
  - `tools-cc use source:commands/` 导入所有 commands
- 新增 `--ls` 模式：`tools-cc use --ls` 列出源内容而不创建链接
- 新增 `tools-cc export` 命令：导出项目或全局配置到 JSON 文件
  - `tools-cc export` 导出项目配置
  - `tools-cc export -g` 导出全局配置
- 新增 `codex` 工具支持，创建 `.codex -> .toolscc` 符号链接

### Changed
- 重构 `use` 命令，支持路径语法和 `--ls` 模式
- 重构 `useSource` 核心逻辑，支持部分导入

### Removed
- 删除临时设计和实现文档 (docs/plans 目录)

## [1.0.4] - 2026-02-28

### Added
- 新增英文版项目说明文档 README_en.md

### Changed
- 优化项目初始化与源码同步逻辑

## [1.0.3] - 2026-02-26

### Changed
- 项目配置文件位置从 `tools-cc.json` 改为 `.toolscc/config.json`
- 优化文档命令描述，明确区分全局和项目命令

## [1.0.2] - 2026-02-26

### Added
- 新增 `tools-cc -s scan` 命令：扫描 sourcesDir 目录，自动发现并添加配置源
- 新增 `tools-cc -s upgrade [name]` 命令别名：执行 git pull 更新配置源代码
- 新增 `tools-cc update [sources...]` 命令：同步配置源内容到项目 .toolscc 目录

### Changed
- 优化帮助文档，添加工作流说明和命令对比表

## [1.0.1] - 2026-02-25

### Added
- 补充 package.json 仓库相关元数据（repository、bugs、homepage）

## [1.0.0] - 2026-02-25

### Added
- 项目初始化，基于 TypeScript + Commander 构建 CLI 框架
- 全局配置管理模块
  - `tools-cc -c set <key> <value>` 设置配置
  - `tools-cc -c get <key>` 查看配置
  - `tools-cc config list` 查看完整配置
- 配置源管理模块
  - `tools-cc -s add <name> <path-or-url>` 添加配置源（支持 Git URL 和本地路径）
  - `tools-cc -s list` 列出所有配置源
  - `tools-cc -s remove <name>` 移除配置源
  - `tools-cc -s update [name]` 更新配置源（git pull）
- 项目管理模块
  - `tools-cc use [sources...]` 启用配置源并创建符号链接
  - `tools-cc list` 列出已启用的配置源
  - `tools-cc rm <source>` 禁用配置源
  - `tools-cc status` 查看项目状态
- 符号链接管理模块（支持 Windows Junction）
- Manifest 加载和扫描模块
- 中英双语帮助信息 (`tools-cc help`)
- 单元测试覆盖（vitest）

### Supported Tools
| 工具 | 链接名称 |
|------|----------|
| iflow | `.iflow` |
| claude | `.claude` |
| codebuddy | `.codebuddy` |
| opencode | `.opencode` |
| codex | `.codex` |

---

## 版本说明

- **主版本号**: 不兼容的 API 变更
- **次版本号**: 向后兼容的功能新增
- **修订号**: 向后兼容的问题修复
