import fs from 'fs-extra';
import path from 'path';

export async function createSymlink(
  target: string,
  linkPath: string,
  force: boolean = false
): Promise<void> {
  // 如果目标已存在
  if (await fs.pathExists(linkPath)) {
    if (!force) {
      throw new Error(`Path already exists: ${linkPath}. Use force=true to overwrite.`);
    }
    
    // 检查是否已经是符号链接
    if (await isSymlink(linkPath)) {
      await fs.remove(linkPath);
    } else {
      // 是真实目录，删除
      await fs.remove(linkPath);
    }
  }
  
  // 确保目标存在
  if (!(await fs.pathExists(target))) {
    throw new Error(`Target does not exist: ${target}`);
  }
  
  // 创建符号链接
  // Windows: 使用 junction (不需要管理员权限)
  // Linux/macOS: 使用 symlink
  const targetPath = path.resolve(target);
  
  if (process.platform === 'win32') {
    // Windows: 使用 junction
    await fs.ensureSymlink(targetPath, linkPath, 'junction');
  } else {
    // Linux/macOS: 使用 dir symlink
    await fs.ensureSymlink(targetPath, linkPath, 'dir');
  }
}

export async function removeSymlink(linkPath: string): Promise<void> {
  if (await isSymlink(linkPath)) {
    await fs.remove(linkPath);
  }
}

export async function isSymlink(path: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}
