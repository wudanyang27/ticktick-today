# TickTick Today - Obsidian Plugin

> ⚠️ **Important**: This plugin only supports macOS and requires the TickTick application.

🎯 An Obsidian plugin specifically designed for GTD (Getting Things Done) methodology. It directly fetches today's tasks from the TickTick app and displays them in the sidebar, allowing you to quickly view and complete daily tasks while writing and thinking.

**Design Philosophy**: This plugin is not intended to replace TickTick, but serves as an auxiliary tool for GTD practice. Task creation, editing, project management, and other primary operations should still be performed in TickTick. The plugin's role is to provide convenient today's task overview and quick completion functionality while you focus on your work in Obsidian.

![Plugin Screenshot](https://img.shields.io/badge/Obsidian-Plugin-blueviolet)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![macOS Only](https://img.shields.io/badge/platform-macOS-lightgrey)

📖 **Language**: [中文文档](README-zh.md) | English

## ✨ Core Features

- 🔗 **Direct TickTick Integration**: Fetches TickTick today's tasks via macOS JXA API
- 📱 **Sidebar Panel**: Dedicated today's task overview interface without app switching
- ⚡ **Quick Task Completion**: Mark tasks as complete directly in Obsidian with real-time sync to TickTick
- 🔄 **Smart Auto-Refresh**: Configurable periodic updates to keep task status synchronized
- 🏷️ **Project Information Display**: Shows task project names with Chinese project name support
- 📅 **Smart Time Display**: Human-readable time display (today, tomorrow, X days ago/later)
- 🔗 **Quick Navigation**: Click task titles to jump directly to TickTick for detailed operations
- 📌 **Pinned Tasks Priority**: Pinned tasks automatically appear at the top

## 🎯 Use Cases and Positioning

### GTD Workflow Assistant
This plugin helps GTD practitioners while using Obsidian for knowledge management, writing, or thinking by:
- Quickly browsing today's to-do items
- Completing simple tasks without leaving Obsidian
- Maintaining visual reminders of important tasks
- Seamlessly connecting thinking work with task execution

### Not a TickTick Replacement
Please note that this plugin is **not** intended to replace TickTick, but serves as a complementary tool:
- ✅ **Suitable for**: Quick task viewing, marking completion status, getting task reminders
- ❌ **Not suitable for**: Creating new tasks, editing task details, managing projects, setting reminders
- 💡 **Recommendation**: Task creation, editing, project management, and other core operations should still be performed in TickTick

## 🖥️ System Requirements

- **Operating System**: macOS (Required, uses JXA technology)
- **TickTick Application**: Installed and logged in
- **Obsidian Version**: 0.15.0+
- **System Permissions**: Obsidian needs accessibility permissions to access TickTick

## 🚀 Installation and Setup

### 1. Manual Installation
```bash
# Download plugin files to Obsidian plugin directory
mkdir -p ~/.obsidian/plugins/ticktick-today/
# Copy main.js, manifest.json, styles.css to the above directory
```

### 2. Configure System Permissions
1. Open System Preferences → Security & Privacy → Privacy → Accessibility
2. Click the lock icon to unlock settings
3. Add Obsidian application and check to enable

### 3. Enable Plugin
1. Restart Obsidian
2. Go to Settings → Community Plugins
3. Enable "TickTick Today"
4. The plugin will automatically display the today's task panel in the right sidebar

**Important Note**: On first startup, the plugin will automatically create two JXA script files in the plugin directory:
- `ticktick-fetch.js` - For fetching today's tasks
- `ticktick-toggle.js` - For toggling task status

These files will be automatically cleaned up when the plugin is uninstalled.

## 📱 Usage

### Basic Operations
- **Open Panel**: Click the 📅 icon in the left toolbar or use the command palette
- **Refresh Tasks**: Click the 🔄 refresh button at the top of the panel to get the latest status
- **Complete Tasks**: Click the checkbox to the left of a task to quickly mark it as complete
- **View Details**: Click task titles to jump to TickTick for detailed management

### Recommended Workflow
1. **Plan in TickTick**: Create tasks, set projects, schedule time
2. **Execute in Obsidian**: View today's task list, focus on writing and thinking
3. **Quick Mark Complete**: After completing tasks, mark them directly in the plugin without switching apps
4. **Return to TickTick for Detailed Management**: When you need to edit tasks or view details, click to jump to TickTick

### Task Display Rules
- **Sort Priority**: Pinned tasks → Incomplete tasks → Completed tasks
- **Time Sorting**: Within the same group, sorted by due time in ascending order

### Task Information Display
- **Task Title**: Clickable to jump to TickTick for detailed operations
- **Project Name**: Shows the project the task belongs to (supports Chinese display for "Inbox")
- **Due Time**: Smart display (today, tomorrow, X days ago/later, including specific time)
- **Completion Status**: Real-time synchronized display, consistent with TickTick

## ⚙️ Plugin Settings

### Auto-Refresh Settings
- **Enable Auto-Refresh**: Periodically fetch the latest task status
- **Refresh Interval**: 1-60 minutes selectable (default 5 minutes)

### Display Settings
- **Show Completed Tasks**: Choose whether to display completed tasks in the panel
- **TickTick App Name**: Support custom app name (such as Chinese version, etc.)

## 🔧 Technical Features

### JXA Script Management
- **Efficient Execution**: Creates JXA script files on plugin startup to avoid repeated creation overhead
- **Dynamic Updates**: Automatically regenerates script files when settings change
- **Auto Cleanup**: Automatically deletes generated script files when plugin is uninstalled
- **Error Handling**: Comprehensive error capture and user-friendly prompts

### Data Processing
- **Project Caching**: Smart caching of project information to improve response speed
- **Task Parsing**: Complete parsing of TickTick task data structure
- **Status Synchronization**: Bidirectional synchronization of task completion status
- **Type Safety**: Complete TypeScript type definitions

### User Experience
- **Responsive Design**: Adapts to different sidebar widths
- **Theme Compatibility**: Automatically adapts to Obsidian theme colors
- **Smooth Animations**: Visual feedback for task status transitions
- **Smart Links**: Automatically generates TickTick deep links

## 🛠️ Development Information

### Project Structure
```
ticktick-today/
├── main.ts              # Main plugin code (TypeScript)
├── main.js              # Compiled plugin file
├── styles.css           # Plugin styles
├── manifest.json        # Plugin manifest
├── ticktick-fetch.js    # JXA task fetching script (generated at runtime)
├── ticktick-toggle.js   # JXA task toggling script (generated at runtime)
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # Project documentation
```

### Development Environment
```bash
# Clone repository
git clone https://github.com/wudanyang27/ticktick-today.git

# Install dependencies
npm install

# Development mode (auto compile and watch)
npm run dev

# Build production version
npm run build
```

### Technology Stack
- **TypeScript**: Primary development language
- **Obsidian API**: Plugin development framework
- **JXA (JavaScript for Automation)**: macOS automation technology
- **CSS3**: Interface styling
- **Node.js**: Build toolchain

## 🔍 Troubleshooting

### Common Issues

**Q: Why can't I create new tasks in the plugin?**
A: This is a design choice, not a feature defect. This plugin focuses on task overview and quick completion. Task creation and editing should be done in TickTick to:
- Maintain task management integrity and consistency
- Avoid feature duplication and interface complexity
- Let users focus on Obsidian's core value: knowledge management

**Q: TickTick tasks are not showing up?**
A: Please check:
- Is the TickTick app open and logged in
- Has macOS granted Obsidian accessibility permissions
- Is the plugin properly enabled in settings
- Check the console for any error messages

**Q: Task status toggle fails?**
A: Possible reasons:
- TickTick app has no network connection
- Task ID retrieval failed
- System permissions were revoked
- Try restarting the TickTick app and retry

**Q: Plugin fails to load?**
A: Solutions:
- Confirm you're running on macOS (this plugin doesn't support Windows/Linux)
- Check if plugin files are complete
- View Obsidian console error messages
- Try reinstalling the plugin

**Q: JXA script file related issues?**
A: 
- Script files are automatically created when the plugin starts
- If files are corrupted, restarting the plugin will regenerate them
- Manually deleting script files won't affect plugin functionality

### Debugging Tips
1. Open Obsidian Developer Console (Cmd+Option+I)
2. Check the Console tab for error messages
3. Verify JXA script files exist in the plugin directory
4. Manually test JXA scripts in terminal:
   ```bash
   osascript -l JavaScript /path/to/ticktick-fetch.js
   ```

## 📋 Usage Examples

### Typical Scenarios in GTD Practice

#### Scenario 1: A Knowledge Worker's Day
1. **Morning Planning**: Review and adjust today's tasks in TickTick
2. **Focused Work**: Open Obsidian to start writing, with today's task overview in the sidebar
3. **Task Reminders**: Quickly browse to-do items during writing breaks, maintaining awareness of priorities
4. **Quick Completion**: Mark simple tasks as complete directly in the plugin without interrupting thought flow
5. **Deep Operations**: When detailed task editing is needed, click to jump to TickTick

#### Scenario 2: Research Workflow
1. **Literature Reading**: Read and take notes in Obsidian
2. **Task Association**: See today's "organize research notes" task
3. **Instant Completion**: After organizing notes, mark the task complete directly in the sidebar
4. **Status Sync**: Task status automatically syncs to TickTick, visible on other devices

### Best Practice Recommendations
- **Task Creation**: Always create and manage tasks in TickTick
- **Quick Overview**: Use the plugin for visual reminders of today's tasks
- **Focus Mode**: During deep work, maintain awareness of important tasks through the plugin
- **Seamless Switching**: One-click jump to TickTick when detailed operations are needed
- **Status Sync**: Use quick completion feature to maintain cross-device task status consistency

## 🤝 Contributing

Contributions of code, issue reports, or suggestions are welcome!

### Reporting Issues
- Use GitHub Issues to report bugs
- Provide detailed steps to reproduce the problem
- Include system environment information

### Feature Suggestions
- Mark as "enhancement" in Issues
- Describe the desired functionality in detail
- Explain use cases and requirements

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 📞 Contact

- **Author**: wudanyang27
- **GitHub**: [https://github.com/wudanyang27](https://github.com/wudanyang27)
- **Project Home**: [https://github.com/wudanyang27/ticktick-today](https://github.com/wudanyang27/ticktick-today)

---

**⚠️ Important Notes**: 
- This plugin **only supports macOS**, using JXA (JavaScript for Automation) technology to communicate with TickTick
- This plugin is an **auxiliary tool** for GTD workflow, not a replacement for TickTick
- Task creation, editing, project management, and other primary functions should be performed in the TickTick app
- The plugin is primarily for quick viewing of today's tasks and marking completion status

**🙏 Acknowledgments**: Thanks to the Obsidian community and TickTick for providing excellent platforms that make GTD practice more efficient and convenient.
