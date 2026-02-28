# tools-cc

一个用于统一管理多个 AI 编程工具（iflow、claude、codebuddy、opencode 等）的 skills/commands/agents 配置的 CLI 工具。通过符号链接机制，避免在多个工具间重复配置。

## 安装

```bash
# 从 npm 安装
npm install -g tools-cc

# 或从源码构建
git clone https://github.com/q759410559/tools-cc.git
cd tools-cc
npm install
npm run build
npm link
```

## 快速上手

```bash
# 1. 设置配置源存储位置（可选，默认为 ~/.tools-cc/sources）
tools-cc -c set sourcesDir D:/skills-hub-sources

# 2. 添加配置源（支持 Git URL 或本地路径）
tools-cc -s add my-skills https://github.com/user/my-skills.git
tools-cc -s add local-skills D:/path/to/local-skills

# 或者扫描源目录自动发现并添加配置
tools-cc -s scan

# 3. 查看已添加的配置源
tools-cc -s list

# 4. 在项目中启用配置源并创建链接
cd my-project
tools-cc use my-skills -p iflow claude

# 4a. 或使用部分引入（只引入需要的 skills/commands/agents）
tools-cc use my-skills/skills/a-skill
tools-cc use my-skills -ls                 # 交互式选择

# 4b. 或从配置文件快速导入
tools-cc use -c project-config.json

# 5. 查看项目状态
tools-cc status

# 6. 查看已启用的配置源
tools-cc list

# 7. 更新配置源（从源目录同步最新内容到项目）
tools-cc update my-skills
tools-cc update              # 更新全部

# 8. 移除配置源
tools-cc rm my-skills
```

## 工作流说明

### 全局配置源管理 vs 项目配置

| 命令 | 作用域 | 说明 |
|------|--------|------|
| `tools-cc -s add/remove/list` | 全局 | 管理全局配置源 |
| `tools-cc -s update/upgrade` | 全局 | git pull 更新源代码 |
| `tools-cc -s scan` | 全局 | 扫描目录发现新源 |
| `tools-cc use/rm` | 项目 | 在项目中启用/禁用源 |
| `tools-cc update` | 项目 | 同步源内容到项目 |

### 典型工作流

```bash
# 场景1: 配置源有更新，需要同步到项目
tools-cc -s upgrade my-skills    # 1. git pull 更新源代码
cd my-project
tools-cc update my-skills        # 2. 同步到项目 .toolscc 目录

# 场景2: 批量更新所有源
tools-cc -s upgrade              # 1. 更新所有 git 源
cd my-project
tools-cc update                  # 2. 同步所有源到项目
```

## 命令列表

### Source 管理

```bash
# 快捷方式 (-s)
tools-cc -s add <name> <path-or-url>     # 添加配置源（Git URL 或本地路径）
tools-cc -s list                          # 列出所有配置源 (缩写: -s ls)
tools-cc -s remove <name>                 # 移除配置源 (缩写: -s rm)
tools-cc -s update [name]                 # git pull 更新配置源代码 (缩写: -s up, -s upgrade)
tools-cc -s scan                          # 扫描 sourcesDir 目录，自动发现并添加配置源

# 完整命令 (sources)
tools-cc sources add <name> <path-or-url> # 添加配置源
tools-cc sources list                     # 列出所有配置源 (缩写: sources ls)
tools-cc sources remove <name>            # 移除配置源 (缩写: sources rm)
tools-cc sources update [name]            # git pull 更新配置源代码 (缩写: sources up, sources upgrade)
tools-cc sources scan                     # 扫描 sourcesDir 目录，自动发现并添加配置源
```

### 项目配置

```bash
tools-cc use [sources...] [options]       # 启用配置源并创建符号链接
tools-cc update [sources...]              # 同步配置源内容到项目 .toolscc 目录
tools-cc list                             # 列出已启用的配置源
tools-cc rm <source>                      # 禁用配置源
tools-cc status                           # 查看项目状态
tools-cc export [options]                 # 导出项目或全局配置
```

#### `use` 命令详解

```bash
# 整源引入（全部 skills/commands/agents）
tools-cc use my-skills
tools-cc use my-skills -p iflow claude    # 指定工具链接

# 部分引入（路径语法）
tools-cc use my-skills/skills/a-skill     # 引入单个 skill
tools-cc use my-skills/commands/test      # 引入单个 command
tools-cc use my-skills/agents/reviewer    # 引入单个 agent
tools-cc use my-skills/skills/a my-skills/commands/test  # 引入多项

# 交互式选择（-ls 参数）
tools-cc use my-skills -ls                # 分组展示，勾选引入

# 从配置文件导入
tools-cc use -c project-config.json       # 快速恢复项目配置

# 使用 "." 表示当前项目已配置的源（只创建链接，不复制内容）
tools-cc use . -p iflow claude
```

#### `export` 命令详解

```bash
# 导出项目配置（包含具体选择）
tools-cc export                           # 导出到 .toolscc-export.json
tools-cc export -o my-config.json         # 指定输出路径

# 导出全局配置
tools-cc export --global                  # 导出到 .toolscc-global-export.json
tools-cc export --global -o global.json   # 指定输出路径
```

### Config 管理

```bash
# 快捷方式 (-c)
tools-cc -c set <key> <value>             # 设置配置
tools-cc -c get <key>                     # 查看配置

# 完整命令 (config)
tools-cc config set <key> <value>         # 设置配置
tools-cc config get <key>                 # 查看配置
tools-cc config list                      # 查看完整全局配置
```

### 帮助

```bash
tools-cc help                             # 显示中英双语帮助信息
tools-cc --help                           # 显示命令行帮助
tools-cc --version                        # 显示版本号
```

## 支持的工具

| 工具 | 链接名称 |
|------|----------|
| iflow | `.iflow` |
| claude | `.claude` |
| codebuddy | `.codebuddy` |
| opencode | `.opencode` |

## 配置源结构

配置源目录应包含以下结构：

```
my-skills/
├── manifest.json          # 可选，描述组件信息
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── commands/
│   └── my-command.md
└── agents/
    └── my-agent.md
```

### manifest.json 格式

```json
{
  "name": "my-skills",
  "version": "1.0.0",
  "skills": ["my-skill"],
  "commands": ["my-command"],
  "agents": ["my-agent"]
}
```

如果没有 `manifest.json`，CLI 会自动扫描目录结构生成。

## 项目结构

使用 `tools-cc use` 后，项目目录结构：

```
my-project/
├── .toolscc/                     # 实际内容目录
│   ├── config.json               # 项目配置
│   ├── skills/                   # 扁平化，带来源前缀
│   │   └── my-skills-my-skill/
│   ├── commands/
│   │   └── my-skills/
│   └── agents/
│       └── my-skills/
├── .iflow -> .toolscc            # 符号链接
└── .claude -> .toolscc
```

## 配置文件

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

### 项目配置 `项目/.toolscc/config.json`

```json
{
  "sources": {
    "my-skills": {
      "skills": ["a-skill", "b-skill"],
      "commands": ["test"],
      "agents": ["*"]
    }
  },
  "links": ["iflow", "claude"]
}
```

**说明：**
- `sources` 记录每个源具体引入了哪些内容
- `["*"]` 表示引入该类型全部内容
- `[]` 表示不引入该类型任何内容
```

## 许可证

MIT
