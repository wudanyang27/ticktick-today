# TickTick Today - Obsidian Plugin

🎯 一个强大的Obsidian插件，直接从TickTick应用获取今日任务并在侧边栏显示，支持实时任务管理和状态同步。

![Plugin Screenshot](https://img.shields.io/badge/Obsidian-Plugin-blueviolet)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![macOS Only](https://img.shields.io/badge/platform-macOS-lightgrey)

## ✨ 核心功能

- 🔗 **TickTick直接集成**: 通过macOS JXA API直接获取TickTick今日任务
- 📱 **侧边栏面板**: 专用的今日任务管理界面，无需切换应用
- ⚡ **实时任务切换**: 在Obsidian中直接完成/取消任务，状态实时同步到TickTick
- 🔄 **智能自动刷新**: 可配置的定时更新，保持任务同步
- 🏷️ **项目信息**: 显示任务所属项目名称，支持中文项目名
- 📅 **智能时间显示**: 人性化的时间显示（今天、明天、X天前/后）
- 🔗 **可点击链接**: 点击任务标题直接跳转到TickTick应用查看详情
- 📌 **置顶任务优先**: 置顶任务自动排在最前面

## 🖥️ 系统要求

- **操作系统**: macOS（必须，使用JXA技术）
- **TickTick应用**: 已安装并登录
- **Obsidian版本**: 0.15.0+
- **系统权限**: Obsidian需要辅助功能权限来访问TickTick

## 🚀 安装和设置

### 1. 手动安装
```bash
# 下载插件文件到Obsidian插件目录
mkdir -p ~/.obsidian/plugins/ticktick-today/
# 复制 main.js, manifest.json, styles.css 到上述目录
```

### 2. 配置系统权限
1. 打开系统偏好设置 → 安全性与隐私 → 隐私 → 辅助功能
2. 点击锁图标解锁设置
3. 添加Obsidian应用并勾选启用

### 3. 启用插件
1. 重启Obsidian
2. 打开设置 → 第三方插件
3. 启用"TickTick Today"
4. 插件会自动在右侧边栏显示今日任务面板

**重要提示**: 插件首次启动时会在插件目录自动创建两个JXA脚本文件：
- `ticktick-fetch.js` - 用于获取今日任务
- `ticktick-toggle.js` - 用于切换任务状态

这些文件会在插件卸载时自动清理。

## 📱 使用方法

### 基本操作
- **打开面板**: 点击左侧工具栏的📅图标或使用命令面板
- **刷新任务**: 点击面板顶部的🔄刷新按钮
- **完成任务**: 点击任务左侧的复选框
- **查看详情**: 点击任务标题跳转到TickTick查看完整信息

### 任务显示规则
- **排序优先级**: 置顶任务 → 未完成任务 → 已完成任务
- **时间排序**: 在同一分组内按到期时间升序排列

### 任务信息显示
- **任务标题**: 可点击跳转到TickTick
- **项目名称**: 显示任务所属项目（支持"收集箱"中文显示）
- **到期时间**: 智能显示（今天、明天、X天前/后，包含具体时间）
- **完成状态**: 实时同步显示

## ⚙️ 插件设置

### 自动刷新设置
- **启用自动刷新**: 定时获取最新任务状态
- **刷新间隔**: 1-60分钟可选（默认5分钟）

### 显示设置
- **显示已完成任务**: 选择是否在面板中显示已完成的任务
- **TickTick应用名称**: 支持自定义应用名称（如中文版等）

## 🔧 技术特性

### JXA脚本管理
- **高效执行**: 插件启动时创建JXA脚本文件，避免重复创建开销
- **动态更新**: 设置更改时自动重新生成脚本文件
- **自动清理**: 插件卸载时自动删除生成的脚本文件
- **错误处理**: 完善的错误捕获和用户友好的提示

### 数据处理
- **项目缓存**: 智能缓存项目信息，提高响应速度
- **任务解析**: 完整解析TickTick任务数据结构
- **状态同步**: 双向同步任务完成状态
- **类型安全**: 完整的TypeScript类型定义

### 用户体验
- **响应式设计**: 适配不同宽度的侧边栏
- **主题兼容**: 自动适配Obsidian主题颜色
- **平滑动画**: 任务状态切换的视觉反馈
- **智能链接**: 自动生成TickTick深度链接

## 🛠️ 开发信息

### 项目结构
```
ticktick-today/
├── main.ts              # 主插件代码（TypeScript）
├── main.js              # 编译后的插件文件
├── styles.css           # 插件样式
├── manifest.json        # 插件清单
├── ticktick-fetch.js    # JXA任务获取脚本（运行时生成）
├── ticktick-toggle.js   # JXA任务切换脚本（运行时生成）
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript配置
└── README.md           # 项目文档
```

### 开发环境
```bash
# 克隆仓库
git clone https://github.com/wudanyang27/ticktick-today.git

# 安装依赖
npm install

# 开发模式（自动编译和监视）
npm run dev

# 构建生产版本
npm run build
```

### 技术栈
- **TypeScript**: 主要开发语言
- **Obsidian API**: 插件开发框架
- **JXA (JavaScript for Automation)**: macOS自动化技术
- **CSS3**: 界面样式
- **Node.js**: 构建工具链

## 🔍 故障排除

### 常见问题

**Q: TickTick任务没有显示怎么办？**
A: 请检查：
- TickTick应用是否已打开并登录
- macOS是否给予Obsidian辅助功能权限
- 插件是否在设置中正确启用
- 检查控制台是否有错误信息

**Q: 任务状态切换失败？**
A: 可能原因：
- TickTick应用没有网络连接
- 任务ID获取失败
- 系统权限被撤销
- 建议重启TickTick应用后重试

**Q: 插件加载失败？**
A: 解决方法：
- 确认是在macOS系统上运行
- 检查插件文件是否完整
- 查看Obsidian控制台的错误信息
- 尝试重新安装插件

**Q: JXA脚本文件相关问题？**
A: 
- 脚本文件会在插件启动时自动创建
- 如果文件损坏，重启插件会重新生成
- 手动删除脚本文件不会影响插件功能

### 调试技巧
1. 打开Obsidian开发者控制台（Cmd+Option+I）
2. 查看Console标签页的错误信息
3. 检查插件目录中的JXA脚本文件是否存在
4. 在终端中手动测试JXA脚本：
   ```bash
   osascript -l JavaScript /path/to/ticktick-fetch.js
   ```

## 📋 使用示例

### 典型工作流程
1. **早晨启动**: 打开Obsidian，自动显示今日任务
2. **任务管理**: 在侧边栏中查看和完成任务
3. **实时同步**: 任务状态自动同步到TickTick
4. **跨设备**: 在其他设备上查看更新后的任务状态

### 最佳实践
- 利用TickTick的优先级功能标记重要任务
- 使用项目分类组织不同类型的任务
- 设置合适的自动刷新间隔避免过度占用资源
- 结合Obsidian的其他插件创建完整的生产力工作流

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 报告问题
- 使用GitHub Issues报告Bug
- 详细描述问题复现步骤
- 提供系统环境信息

### 功能建议
- 在Issues中标记为"enhancement"
- 详细描述期望的功能
- 说明使用场景和需求

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- **作者**: wudanyang27
- **GitHub**: [https://github.com/wudanyang27](https://github.com/wudanyang27)
- **项目主页**: [https://github.com/wudanyang27/ticktick-today](https://github.com/wudanyang27/ticktick-today)

---

**⚠️ 注意**: 此插件仅支持macOS系统，需要TickTick应用配合使用。其他操作系统的用户请寻找替代方案。

**🙏 感谢**: 感谢Obsidian社区和TickTick提供的优秀平台，让这个插件成为可能。
