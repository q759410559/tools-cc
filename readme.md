tools-cc [options] <command> [args]

# Source 管理
tools-cc -s add <name> <path-or-url>     # 添加配置源
tools-cc -s list                          # 列出所有配置源 (-s ls)
tools-cc -s remove <name>                 # 移除配置源 (-s rm)
tools-cc -s update [name]                 # 更新配置源 (-s up)

# 项目配置
tools-cc use [source-names...] [-p tools...]   # 启用配置源并可选创建链接
tools-cc list                        # 列出已启用的配置源
tools-cc rm <name>               # 禁用配置源

# Config 管理
tools-cc -c set <key> <value>             # 设置配置
tools-cc -c get <key>                     # 查看配置

# 信息查看
tools-cc status                           # 查看项目状态

