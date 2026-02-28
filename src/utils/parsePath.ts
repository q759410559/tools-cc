import { SourceSelection } from '../types/config';

/**
 * 解析后的源路径
 */
export interface ParsedSourcePath {
  sourceName: string;
  type?: 'skills' | 'commands' | 'agents';
  itemName?: string;
}

/**
 * 解析源路径字符串
 * 
 * 支持的格式：
 * - 'my-skills' → { sourceName: 'my-skills' } (整个源)
 * - 'my-skills/skills/a-skill' → { sourceName: 'my-skills', type: 'skills', itemName: 'a-skill' }
 * - 'my-skills/commands/test' → { sourceName: 'my-skills', type: 'commands', itemName: 'test' }
 * - 'other/agents/reviewer' → { sourceName: 'other', type: 'agents', itemName: 'reviewer' }
 * 
 * 无效路径只返回 sourceName
 */
export function parseSourcePath(input: string): ParsedSourcePath {
  const parts = input.split('/');
  
  // 至少需要源名称
  if (parts.length === 0 || input === '') {
    return { sourceName: '' };
  }
  
  const sourceName = parts[0];
  
  // 只有源名称，返回整个源
  if (parts.length === 1) {
    return { sourceName };
  }
  
  // 检查第二部分是否为有效类型
  const validTypes = ['skills', 'commands', 'agents'] as const;
  const type = parts[1] as typeof validTypes[number];
  
  if (!validTypes.includes(type)) {
    return { sourceName };
  }
  
  // 检查第三部分（项目名称）
  if (parts.length < 3 || !parts[2]) {
    return { sourceName };
  }
  
  return {
    sourceName,
    type,
    itemName: parts[2]
  };
}

/**
 * 从路径数组构建选择配置
 * 
 * 将多个路径转换为 Record<string, SourceSelection> 格式
 * 
 * 示例：
 * ['my-skills/skills/a', 'my-skills/skills/b', 'my-skills/commands/test']
 * → { 'my-skills': { skills: ['a', 'b'], commands: ['test'], agents: [] } }
 */
export function buildSelectionFromPaths(paths: string[]): Record<string, SourceSelection> {
  const result: Record<string, SourceSelection> = {};
  
  for (const path of paths) {
    const parsed = parseSourcePath(path);
    const { sourceName, type, itemName } = parsed;
    
    // 跳过空源名称
    if (!sourceName) {
      continue;
    }
    
    // 初始化源选择（如果不存在）
    if (!result[sourceName]) {
      result[sourceName] = {
        skills: [],
        commands: [],
        agents: []
      };
    }
    
    // 如果没有指定类型和项目名称，表示整个源
    if (!type || !itemName) {
      result[sourceName] = {
        skills: ['*'],
        commands: ['*'],
        agents: ['*']
      };
      continue;
    }
    
    // 添加项目到对应的类型数组（去重）
    const selection = result[sourceName];
    const targetArray = selection[type];
    
    if (!targetArray.includes(itemName)) {
      targetArray.push(itemName);
    }
  }
  
  return result;
}
