# 部分引入与配置导入导出功能设计

## 概述

为 tools-cc 新增两个核心功能：
1. **部分引入**：支持从源中选择性引入特定的 skills/commands/agents
2. **配置导入导出**：支持全局配置和项目配置的导入导出，方便迁移和复用

## 功能需求

### 功能一：部分引入

- 支持通过路径语法精确指定引入内容：`tools-cc use my-skills/skills/a-skill`
- 支持交互式选择：`tools-cc use my-skills -ls`，分类展示 skills/commands/agents 供勾选
- 三种类型（skills/commands/agents）均支持选择性引入

### 功能二：配置导入导出

- 导出全局配置：`tools-cc export --global`
- 导出项目配置：`tools-cc export`
- 从配置文件导入：`tools-cc use -c <配置文件>`

## 数据结构设计

### ProjectConfig 变更

**原有结构：**
```typescript
interface ProjectConfig {
  sources: string[];  // ["my-skills", "other-source"]
  links: string[];
}
```

**新增结构：**
```typescript
interface SourceSelection {
  skills: string[];     // ["a-skill", "b-skill"] 或 ["*"] 表示全部
  commands: string[];
  agents: string[];
}

interface ProjectConfig {
  sources: Record<string, SourceSelection>;  // {"my-skills": {...}}
  links: string[];
}
```

### 配置文件格式

**项目配置导出格式：**
```json
{
  "version": "1.0",
  "sources": {
    "my-skills": {
      "skills": ["a-skill", "b-skill"],
      "commands": ["test"],
      "agents": ["reviewer"]
    }
  },
  "links": ["iflow", "claude"]
}
```

**全局配置导出格式：**
```json
{
  "version": "1.0",
  "sourcesDir": "~/.tools-cc/sources",
  "sources": {
    "my-skills": { "type": "git", "url": "https://..." },
    "local-stuff": { "type": "local", "path": "/path/to/stuff" }
  }
}
```

## 命令设计

### 部分引入

```bash
# 引入单个 skill
tools-cc use my-skills/skills/a-skill

# 引入多个（空格分隔）
tools-cc use my-skills/skills/a-skill my-skills/commands/test

# 混合多个源
tools-cc use my-skills/skills/a-skill other-source/agents/reviewer

# 整源引入（保持兼容）
tools-cc use my-skills
```

**路径解析规则：**
- `source` → 整个源（全部 skills/commands/agents）
- `source/skills/name` → 单个 skill
- `source/commands/name` → 单个 command
- `source/agents/name` → 单个 agent

### 交互选择

```bash
tools-cc use my-skills -ls
```

交互界面使用 inquirer-separator 分组展示：
```
? Select items from my-skills:
❯ ◯ ── Skills ──
  ◉ a-skill
  ◉ b-skill
  ◯ c-skill
  ◯ ── Commands ──
  ◉ test
  ◯ build
  ◯ ── Agents ──
  ◯ reviewer
  ◯ helper
```

### 配置导入

```bash
tools-cc use -c project-config.json      # 从文件导入项目配置
tools-cc use -c project-config.json -p iflow  # 指定工具链接
```

### 配置导出

```bash
tools-cc export                      # 导出项目配置到 .toolscc-export.json
tools-cc export -o my-config.json    # 指定输出路径
tools-cc export --global             # 导出全局配置
tools-cc export --global -o global-backup.json
```

## 核心实现

### 路径解析函数

```typescript
interface ParsedSourcePath {
  sourceName: string;
  type?: 'skills' | 'commands' | 'agents';
  itemName?: string;
}

function parseSourcePath(input: string): ParsedSourcePath {
  // my-skills → { sourceName: "my-skills" }
  // my-skills/skills/a-skill → { sourceName: "my-skills", type: "skills", itemName: "a-skill" }
}
```

### useSource 函数重构

```typescript
useSource(
  sourceName: string, 
  sourceDir: string, 
  projectDir: string,
  selection?: SourceSelection  // 可选，不传则全部引入
)
```

复制逻辑：
- 如果 `selection` 为空或某类型为 `["*"]`，复制该类型全部
- 否则只复制选中的项目

### 交互选择流程

```typescript
async function interactiveSelect(sourceName: string, sourceDir: string): Promise<SourceSelection> {
  // 1. 扫描源目录，获取所有 skills/commands/agents
  const manifest = await scanSource(sourceDir);
  
  // 2. 构建带分组的 choices
  const choices = [
    new Separator('── Skills ──'),
    ...manifest.skills.map(s => ({ name: s, value: `skills/${s}` })),
    new Separator('── Commands ──'),
    ...manifest.commands.map(c => ({ name: c, value: `commands/${c}` })),
    new Separator('── Agents ──'),
    ...manifest.agents.map(a => ({ name: a, value: `agents/${a}` })),
  ];
  
  // 3. inquirer checkbox
  const answers = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selected',
    message: `Select items from ${sourceName}:`,
    choices
  }]);
  
  // 4. 转换为 SourceSelection 格式
  return parseSelection(answers.selected);
}
```

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/types/config.ts` | 新增 `SourceSelection` 接口，修改 `ProjectConfig` |
| `src/commands/use.ts` | 重构 `handleUse`，新增路径解析、交互选择、导入逻辑 |
| `src/commands/export.ts` | **新建**，处理 `export` 命令 |
| `src/core/project.ts` | 重构 `useSource` 支持部分引入，新增导入导出函数 |
| `src/index.ts` | 注册 `export` 命令 |
| `tests/core/project.test.ts` | 更新测试用例 |
| `tests/commands/export.test.ts` | **新建**，测试导出命令 |

## 兼容性

### 向后兼容

项目配置中 `sources` 支持两种格式：
- 旧格式 `["my-skills"]` → 自动转换为 `{ "my-skills": { skills: ["*"], commands: ["*"], agents: ["*"] } }`
- 新格式 `{"my-skills": {...}}` → 直接使用

### 错误处理

- 指定的源不存在 → 提示错误
- 指定的 skill/command/agent 不存在 → 提示警告并跳过
- 配置文件格式错误 → 提示具体错误信息
