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

# 3. 查看已添加的配置源
tools-cc -s list

# 4. 在项目中启用配置源并创建链接
cd my-project
tools-cc use my-skills -p iflow claude

# 5. 查看项目状态
tools-cc status

# 6. 查看已启用的配置源
tools-cc list

# 7. 移除配置源
tools-cc rm my-skills
```

## 命令列表

### Source 管理

```bash
# 快捷方式 (-s)
tools-cc -s add <name> <path-or-url>     # 添加配置源
tools-cc -s list                          # 列出所有配置源 (缩写: -s ls)
tools-cc -s remove <name>                 # 移除配置源 (缩写: -s rm)
tools-cc -s update [name]                 # 更新配置源 (缩写: -s up)

# 完整命令 (sources)
tools-cc sources add <name> <path-or-url> # 添加配置源
tools-cc sources list                     # 列出所有配置源 (缩写: sources ls)
tools-cc sources remove <name>            # 移除配置源 (缩写: sources rm)
tools-cc sources update [name]            # 更新配置源 (缩写: sources up)
```

### 项目配置

```bash
tools-cc use [sources...] [-p tools...]   # 启用配置源并创建链接
tools-cc list                             # 列出已启用的配置源
tools-cc rm <source>                      # 禁用配置源
tools-cc status                           # 查看项目状态
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
│   ├── skills/                   # 扁平化，带来源前缀
│   │   └── my-skills-my-skill/
│   ├── commands/
│   │   └── my-skills/
│   └── agents/
│       └── my-skills/
├── .iflow -> .toolscc            # 符号链接
├── .claude -> .toolscc
└── tools-cc.json                 # 项目配置
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

### 项目配置 `项目/tools-cc.json`

```json
{
  "sources": ["my-skills"],
  "links": ["iflow", "claude"]
}
```

## 许可证

MIT
