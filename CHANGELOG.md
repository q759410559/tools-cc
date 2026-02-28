# 变更日志

本项目的所有重要变更都将记录在此文件中。

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

---

## 版本说明

- **主版本号**: 不兼容的 API 变更
- **次版本号**: 向后兼容的功能新增
- **修订号**: 向后兼容的问题修复
