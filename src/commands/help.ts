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
    tools-cc sources update, up [name]           Update source(s) / 更新配置源
    
    ${chalk.gray('Shortcut: -s')}  e.g., tools-cc -s add my-skills https://github.com/user/skills.git

  ${chalk.cyan('Config Management / 配置管理')}
    tools-cc config set <key> <value>            Set config value / 设置配置值
    tools-cc config get <key>                    Get config value / 获取配置值
    tools-cc config list                         Show full config / 显示完整配置
    
    ${chalk.gray('Shortcut: -c')}  e.g., tools-cc -c set sourcesDir D:/skills

  ${chalk.cyan('Project Commands / 项目命令')}
    tools-cc use [sources...] [-p tools...]      Use sources in project / 在项目中启用配置源
    tools-cc list                                List used sources / 列出已启用的配置源
    tools-cc rm <source>                         Remove source from project / 禁用配置源
    tools-cc status                              Show project status / 显示项目状态

  ${chalk.cyan('Help / 帮助')}
    tools-cc help                                Show this help / 显示此帮助信息
    tools-cc --help, -h                          Show command help / 显示命令帮助
    tools-cc --version, -V                       Show version / 显示版本号

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

  ${chalk.gray('# List all sources / 列出所有配置源')}
  tools-cc sources list

  ${chalk.gray('# Use sources in project / 在项目中启用配置源')}
  tools-cc use my-skills -p iflow claude codex

  ${chalk.gray('# Check project status / 检查项目状态')}
  tools-cc status

  ${chalk.gray('# Show full configuration / 显示完整配置')}
  tools-cc config list

${chalk.bold('MORE INFO / 更多信息')}
  GitHub: https://github.com/user/tools-cc
  Docs:   https://github.com/user/tools-cc#readme

${chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════')}
`);
}
