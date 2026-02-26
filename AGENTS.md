# tools-cc 项目上下文

## 项目概述

tools-cc 是一个 CLI 工具，用于统一管理多个 AI 编程工具（iflow、claude、codebuddy、opencode 等）的 skills/commands/agents 配置。通过符号链接机制，避免在多个工具间重复配置。

## 技术栈

- **语言**: TypeScript (ES2020, strict mode)
- **CLI 框架**: Commander.js
- **文件操作**: fs-extra
- **终端输出**: chalk
- **交互式命令**: inquirer
- **测试框架**: vitest
- **运行时**: Node.js (CommonJS)

## 项目结构

```
tools-cc/
├── src/
│   ├── index.ts          # CLI 入口，命令注册
│   ├── commands/         # CLI 命令处理器
│   │   ├── config.ts     # 配置管理命令
│   │   ├── help.ts       # 帮助信息
│   │   ├── source.ts     # 源管理命令
│   │   └── use.ts        # 项目使用命令
│   ├── core/             # 核心业务逻辑
│   │   ├── config.ts     # 配置读写
│   │   ├── manifest.ts   # manifest.json 解析
│   │   ├── project.ts    # 项目管理
│   │   ├── source.ts     # 源管理
│   │   └── symlink.ts    # 符号链接创建
│   ├── types/            # TypeScript 类型定义
│   │   └── config.ts     # 核心接口定义
│   └── utils/
│       └── path.ts       # 路径常量和工具函数
├── tests/                # 测试文件
│   ├── core/             # 核心模块测试
│   └── fixtures/         # 测试固件
└── dist/                 # 编译输出
```

## 构建和运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 编译 TypeScript
npm run build

# 运行编译后的代码
npm start

# 运行测试
npm test

# 运行测试（单次）
npm run test:run

# 全局安装（开发）
npm link
```

## 核心命令

### 全局配置源管理
- `tools-cc -s add <name> <path-or-url>` - 添加配置源
- `tools-cc -s list` - 列出所有配置源
- `tools-cc -s remove <name>` - 移除配置源
- `tools-cc -s update [name]` - git pull 更新源代码
- `tools-cc -s scan` - 扫描目录发现新源

### 项目配置
- `tools-cc use [sources...] [-p tools...]` - 启用配置源并创建符号链接
- `tools-cc update [sources...]` - 同步源内容到项目
- `tools-cc list` - 列出已启用的配置源
- `tools-cc rm <source>` - 禁用配置源
- `tools-cc status` - 查看项目状态

### 配置管理
- `tools-cc config set <key> <value>` - 设置配置
- `tools-cc config get <key>` - 获取配置
- `tools-cc config list` - 查看完整配置

## 支持的 AI 工具

| 工具 | 链接名称 |
|------|----------|
| iflow | `.iflow` |
| claude | `.claude` |
| codebuddy | `.codebuddy` |
| opencode | `.opencode` |

## 配置文件位置

- **全局配置**: `~/.tools-cc/config.json`
- **项目配置**: `项目/.toolscc/config.json`
- **源存储目录**: `~/.tools-cc/sources`（可配置）

## 核心类型

```typescript
// 源配置
interface SourceConfig {
  type: 'git' | 'local';
  url?: string;
  path?: string;
}

// 全局配置
interface GlobalConfig {
  sourcesDir: string;
  sources: Record<string, SourceConfig>;
}

// 项目配置
interface ProjectConfig {
  sources: string[];
  links: string[];
}

// Manifest 文件
interface Manifest {
  name: string;
  version: string;
  skills?: string[];
  commands?: string[];
  agents?: string[];
}
```

## 开发约定

### 代码风格
- 使用 TypeScript strict 模式
- 异步函数使用 async/await
- 文件操作使用 fs-extra
- 命令处理函数命名：`handle*`

### 测试
- 测试文件放在 `tests/` 目录，镜像 `src/` 结构
- 使用 vitest 框架
- 测试固件放在 `tests/fixtures/`

### 命令添加
1. 在 `src/commands/` 创建或修改命令处理文件
2. 在 `src/index.ts` 注册新命令
3. 添加相应的测试

### 文档更新 [CHANGELOG.md](CHANGELOG.md)[README.md](README.md)
- 更新文档时，请确保命令描述清晰、准确，并使用一致的格式
- 添加新命令时，请更新命令列表和描述
- 修改现有命令时，请更新相关命令的描述

## 注意事项

- 此项目运行在 Windows 系统，注意路径分隔符兼容性
- 符号链接在 Windows 上可能需要管理员权限
- 全局配置目录位于用户主目录下的 `.tools-cc`
