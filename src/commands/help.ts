import chalk from 'chalk';

export function showHelp(): void {
  console.log(`
${chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════')}
${chalk.bold('tools-cc')} - AI Coding Tools Configuration Manager
${chalk.bold('tools-cc')} - AI 编程工具配置管理器
${chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════')}

${chalk.bold('DESCRIPTION / 描述')}
  A CLI tool for managing skills/commands/agents configurations across multiple
  AI coding tools (iflow, claude, codebuddy, opencode, codex, etc.) via symlinks.
  
  一个用于统一管理多个 AI 编程工具配置的命令行工具，通过符号链接机制避免重复配置。

${chalk.bold('USAGE / 用法')}
  tools-cc <command> [options]
  tools-cc <shortcut> <subcommand> [args]

${chalk.bold('COMMANDS / 命令')}

  ${chalk.cyan('Source Management / 配置源管理')}
    tools-cc sources add <name> <path-or-url>    Add a source / 添加配置源
    tools-cc sources list, ls                    List all sources / 列出所有配置源
    tools-cc sources remove, rm <name>           Remove a source / 移除配置源
    tools-cc sources update, up [name]           git pull update / 更新源代码
    tools-cc sources scan                        Scan dir for sources / 扫描发现新源
    
    ${chalk.gray('Shortcut: -s')}  e.g., tools-cc -s add my-skills https://github.com/user/skills.git

  ${chalk.cyan('Config Management / 配置管理')}
    tools-cc config set <key> <value>            Set config value / 设置配置值
    tools-cc config get <key>                    Get config value / 获取配置值
    tools-cc config list                         Show full config / 显示完整配置
    
    ${chalk.gray('Shortcut: -c')}  e.g., tools-cc -c set sourcesDir D:/skills

  ${chalk.cyan('Project Commands / 项目命令')}
    tools-cc use [sources...] [options]          Use sources in project / 在项目中启用配置源
    tools-cc update [sources...]                 Sync source content to project / 同步内容到项目
    tools-cc list                                List used sources / 列出已启用的配置源
    tools-cc rm <source>                         Remove source from project / 禁用配置源
    tools-cc status                              Show project status / 显示项目状态
    tools-cc export [options]                    Export config / 导出配置

  ${chalk.cyan('Help / 帮助')}
    tools-cc help                                Show this help / 显示此帮助信息
    tools-cc --help, -h                          Show command help / 显示命令帮助
    tools-cc --version, -V                       Show version / 显示版本号

${chalk.bold('USE OPTIONS / use 命令选项')}
  -p, --tools <tools...>    Target tools (iflow, claude, etc.) / 目标工具
  --ls                      Interactive selection / 交互式选择内容
  -c, --config <file>       Import from config file / 从配置文件导入

${chalk.bold('EXPORT OPTIONS / export 命令选项')}
  -o, --output <file>       Output file path / 输出文件路径
  --global                  Export global config / 导出全局配置

${chalk.bold('SUPPORTED TOOLS / 支持的工具')}
  iflow      → .iflow
  claude     → .claude
  codebuddy  → .codebuddy
  opencode   → .opencode
  codex      → .codex

${chalk.bold('EXAMPLES / 示例')}
  ${chalk.gray('# Add a git source / 添加 Git 配置源')}
  tools-cc sources add my-skills https://github.com/user/my-skills.git

  ${chalk.gray('# Add a local source / 添加本地配置源')}
  tools-cc sources add local-skills D:/path/to/local-skills

  ${chalk.gray('# Scan for sources / 扫描发现配置源')}
  tools-cc sources scan

  ${chalk.gray('# List all sources / 列出所有配置源')}
  tools-cc sources list

  ${chalk.gray('# Use sources in project / 在项目中启用配置源')}
  tools-cc use my-skills -p iflow claude codex

  ${chalk.gray('# Interactive selection / 交互式选择内容')}
  tools-cc use my-skills --ls

  ${chalk.gray('# Import from config file / 从配置文件导入')}
  tools-cc use -c project-config.json

  ${chalk.gray('# Sync source content to project / 同步源内容到项目')}
  tools-cc update my-skills

  ${chalk.gray('# Check project status / 检查项目状态')}
  tools-cc status

  ${chalk.gray('# Export project config / 导出项目配置')}
  tools-cc export -o my-config.json

  ${chalk.gray('# Show full configuration / 显示完整配置')}
  tools-cc config list

${chalk.bold('MORE INFO / 更多信息')}
  GitHub: https://github.com/q759410559/tools-cc
  Docs:   https://github.com/q759410559/tools-cc#readme

${chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════')}
`);
}
