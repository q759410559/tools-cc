# tools-cc

CLI 工具，用于统一管理多个 AI 编程工具（iflow、claude、codebuddy、opencode、codex 等）的 skills/commands/agents/rules 配置。通过符号链接机制，避免在多个工具间重复配置。

## 快速命令

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 编译 TypeScript
npm run build

# 运行测试
npm run test:run
```

## 项目结构

```
src/
├── index.ts           # CLI 入口，Commander.js 命令注册
├── commands/         # 命令处理器
│   ├── config.ts     # 配置管理命令
│   ├── source.ts     # 源管理命令
│   ├── use.ts        # 项目使用命令
│   ├── template.ts   # 模板管理命令
│   ├── export.ts     # 导出命令
│   └── help.ts       # 帮助信息
├── core/             # 核心业务逻辑
│   ├── config.ts     # 配置读写
│   ├── manifest.ts   # manifest.json 解析
│   ├── project.ts    # 项目管理
│   ├── source.ts     # 源管理
│   ├── symlink.ts    # 符号链接创建
│   └── template.ts   # 模板管理
├── types/
│   └── config.ts     # TypeScript 类型定义
└── utils/
    └── path.ts       # 路径工具函数
```

## 架构设计

### 数据流

1. **全局配置** (`~/.tools-cc/config.json`) → 存储配置源位置和源列表
2. **源存储** (`~/.tools-cc/sources/`) → 存储克隆/引用的配置源
3. **项目配置** (`项目/.toolscc/config.json`) → 记录项目中启用的源和选择

### 核心模块

- **config**: 读写全局配置，管理 sourcesDir
- **source**: 添加/移除/更新配置源，支持 git clone 和本地路径
- **project**: 项目初始化，使用/移除源，符号链接管理
- **manifest**: 解析源的 manifest.json，支持自动扫描目录结构
- **template**: 模板保存和应用

### 配置文件

| 作用域 | 路径 | 说明 |
|--------|------|------|
| 全局 | `~/.tools-cc/config.json` | 源目录和源列表 |
| 项目 | `.toolscc/config.json` | 启用的源和链接 |
| 模板 | `~/.tools-cc/templates/` | 保存的项目配置 |

## 命令速查

### 源管理 (全局)

```bash
tools-cc -s add <name> <path-or-url>  # 添加源
tools-cc -s list                      # 列出源
tools-cc -s remove <name>             # 移除源
tools-cc -s update [name]            # git pull 更新
tools-cc -s scan                     # 扫描目录发现源
```

### 项目命令

```bash
tools-cc use [sources...]              # 启用源（支持部分导入）
tools-cc use my-skills -p iflow claude # 指定工具链接
tools-cc use source:skills/xxx        # 部分导入
tools-cc use -c config.json            # 从文件导入
tools-cc update [sources...]          # 同步源内容
tools-cc list                          # 列出已启用源
tools-cc rm <source>                   # 移除源
tools-cc status                        # 查看项目状态
```

### 模板命令

```bash
tools-cc template save [-n <name>]  # 保存为模板
tools-cc template list               # 列出模板
tools-cc template rm <name>          # 删除模板
tools-cc template use [name]         # 应用模板
tools-cc template use -p iflow       # 应用并指定工具
```

### 配置命令

```bash
tools-cc -c set <key> <value>  # 设置配置
tools-cc -c get <key>          # 获取配置
tools-cc config list          # 查看全局配置
```

## 支持的工具

| 工具 | 链接名称 |
|------|----------|
| iflow | `.iflow` |
| claude | `.claude` |
| codebuddy | `.codebuddy` |
| opencode | `.opencode` |
| codex | `.codex` |
| qoder | `.qoder` |

## 类型定义

```typescript
// 源配置
interface SourceConfig {
  type: 'git' | 'local';
  url?: string;
  path?: string;
}

// 源选择配置
interface SourceSelection {
  skills: string[];   // ['*'] 或 ['skill-a', 'skill-b']
  commands: string[];
  agents: string[];
  rules: string[];
}

// 项目配置
interface ProjectConfig {
  sources: Record<string, SourceSelection>;
  links: string[];
}

// Manifest
interface Manifest {
  name: string;
  version: string;
  skills?: string[];
  commands?: string[];
  agents?: string[];
  rules?: string[];
}
```

## 开发约定

- **TypeScript**: ES2020 target, CommonJS, strict mode
- **异步**: 使用 async/await
- **文件操作**: fs-extra
- **CLI**: Commander.js
- **测试**: vitest
- **命令处理**: `handle*` 命名约定

## 注意事项

- 运行在 Windows，注意路径分隔符兼容性
- Windows 上使用 junction 创建符号链接（不需要管理员权限）
- 全局配置目录: `~/.tools-cc`
