# tools-cc CLI 设计文档

## 概述

tools-cc 是一个用于统一管理多个 AI 编程工具（iflow、claude、codebuddy、opencode 等）的 skills、commands、agents 配置的 CLI 工具。通过符号链接机制，避免在多个工具间重复配置。

## 核心需求

- 同时使用多个 AI 编程工具时，避免重复配置 skills/commands/agents
- 支持从 git 仓库或本地目录安装配置源
- 支持同时启用多个配置源
- 全局配置 + 项目级覆盖
- 自动创建符号链接

## 架构设计

### 目录结构

```
~/.tools-cc/                      # 全局配置目录
├── config.json                   # 全局配置
└── cache/                        # 缓存（可选）

D:/skills-hub-sources/            # 用户自定义的 sources 存储位置
├── my-skills/
│   ├── manifest.json
│   ├── skills/
│   ├── commands/
│   └── agents/
└── my-skills2/
    ├── manifest.json
    ├── skills/
    ├── commands/
    └── agents/

项目目录/
├── .toolscc/                     # 实际内容目录
│   ├── skills/                   # 扁平化，带来源前缀
│   │   ├── my-skills-brainstorming/
│   │   └── my-skills2-debugging/
│   ├── commands/
│   │   ├── my-skills/           # 按来源分子目录
│   │   └── my-skills2/
│   └── agents/
│       ├── my-skills/
│       └── my-skills2/
├── .iflow -> .toolscc            # 符号链接
├── .claude -> .toolscc
└── tools-cc.json                 # 项目配置
```

### 关键设计点

1. **skills 目录扁平化**：由于工具只能识别一级目录下的 skills，多个配置源的 skills 使用 `{source-name}-{skill-name}` 命名避免冲突
2. **commands/agents 保持层级**：按来源分子目录，因为工具支持多级目录

## 文件格式

### 全局配置 `~/.tools-cc/config.json`

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

### 项目配置 `项目/tools-cc.json`

```json
{
  "sources": ["my-skills", "local-skills"],
  "links": ["iflow", "claude"]
}
```

### 配置源清单 `sources/my-skills/manifest.json`

```json
{
  "name": "my-skills",
  "version": "1.0.0",
  "skills": ["brainstorming", "debugging"],
  "commands": ["brainstorm", "review"],
  "agents": ["code-reviewer"]
}
```

如果配置源是本地目录且没有 manifest，CLI 会自动扫描目录结构生成。

## CLI 命令

```
tools-cc [options] <command> [args]

# Source 管理
tools-cc -s add <name> <path-or-url>     # 添加配置源
tools-cc -s list                          # 列出所有配置源 (-s ls)
tools-cc -s remove <name>                 # 移除配置源 (-s rm)
tools-cc -s update [name]                 # 更新配置源 (-s up)

# 项目配置
tools-cc use [source-names...] [-p tools...]   # 启用配置源并可选创建链接
tools-cc list                                  # 列出已启用的配置源
tools-cc rm <name>                             # 禁用配置源

# Config 管理
tools-cc -c set <key> <value>             # 设置配置
tools-cc -c get <key>                     # 查看配置

# 信息查看
tools-cc status                           # 查看项目状态
```

## 内置支持的 Tools

```typescript
const SUPPORTED_TOOLS = {
  iflow: { linkName: '.iflow' },
  claude: { linkName: '.claude' },
  codebuddy: { linkName: '.codebuddy' },
  opencode: { linkName: '.opencode' }
}
```

## 数据流

```
用户执行: tools-cc use my-skills -p iflow claude

1. 检查全局配置，确认 my-skills 存在
2. 在项目创建 .toolscc/ 目录
3. 从 sources/my-skills/ 复制/链接组件:
   - skills/* -> .toolscc/skills/my-skills-*/
   - commands/* -> .toolscc/commands/my-skills/
   - agents/* -> .toolscc/agents/my-skills/
4. 创建符号链接:
   - .iflow -> .toolscc
   - .claude -> .toolscc
5. 更新项目配置 tools-cc.json
```

## 技术栈

- **语言**: TypeScript / Node.js
- **CLI 框架**: commander 或 yargs
- **交互式 UI**: inquirer
- **符号链接**: Node.js fs.symlink / fs.symlinkSync

## 使用示例

```bash
# 1. 设置 sources 存储位置
tools-cc -c set sourcesDir D:/skills-hub-sources

# 2. 添加配置源
tools-cc -s add my-skills https://github.com/user/my-skills.git
tools-cc -s add local-skills D:/local-skills

# 3. 在项目中启用配置源并创建链接
cd my-project
tools-cc use my-skills local-skills -p iflow claude

# 4. 查看状态
tools-cc status
tools-cc list

# 5. 禁用某个配置源
tools-cc rm local-skills

# 6. 更新配置源
tools-cc -s update my-skills
```

## 符号链接处理

- **Windows**: 创建 junction 或 symlink（需要管理员权限，或开启开发者模式）
- **Linux/macOS**: 创建标准符号链接

当目标目录已存在时，提示用户确认后强制覆盖删除。

## 后续扩展

- 支持自定义 tool 配置（通过 config 添加新的 tool）
- 支持配置源版本管理
- 支持团队共享配置（通过 git 管理 tools-cc.json）
