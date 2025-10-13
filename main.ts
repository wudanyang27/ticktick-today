import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    ItemView,
    WorkspaceLeaf,
    Notice,
    TFile,
    moment,
    Platform,
    FileSystemAdapter
} from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// macOS JXA interface for TickTick
declare global {
    interface Window {
        require?: any;
    }
}

const VIEW_TYPE_TODAY_TASKS = "today-tasks-view";

interface TickTickTodaySettings {
    refreshInterval: number; // in minutes
    autoRefresh: boolean;
    tickTickAppName: string;
    showRefreshNotice: boolean;
}

const DEFAULT_SETTINGS: TickTickTodaySettings = {
    refreshInterval: 5,
    autoRefresh: true,
    tickTickAppName: 'TickTick',
    showRefreshNotice: true
}

interface Task {
    text: string;
    completed: boolean;
    file?: string;
    line?: number;
    priority: string;
    dueDate?: string;
    id?: string;
    project?: string;
    projectId?: string; // Original project ID used to build links
    tags?: string[];
    pinned?: boolean;
}

interface TickTickTask {
    title: string;
    isCompleted: boolean;
    priority: number;
    dueDate?: string;
    project?: string;
    tags?: string[];
    id: string;
}

export default class TickTickTodayPlugin extends Plugin {
    settings: TickTickTodaySettings;
    private refreshInterval: NodeJS.Timeout | null = null;
    private projectsCache: Map<string, string> = new Map(); // projectId -> projectName
    private jxaScriptPaths: {
        fetch: string;
        toggle: string;
    } | null = null;

    getJXAScriptPaths() {
        return this.jxaScriptPaths;
    }

    async onload() {
        await this.loadSettings();

        // Create JXA script files on startup
        await this.createJXAScripts();

        // Register the view
        this.registerView(
            VIEW_TYPE_TODAY_TASKS,
            (leaf) => new TodayTasksView(leaf, this)
        );

        // Add ribbon icon
    const ribbonIconEl = this.addRibbonIcon('calendar-check', 'Today\'s tasks', (evt: MouseEvent) => {
            this.activateView();
        });
        ribbonIconEl.addClass('ticktick-today-ribbon-class');

        // Add command to open today's tasks
        this.addCommand({
            id: 'open-today-tasks',
            name: 'Open today\'s tasks',
            callback: () => {
                this.activateView();
            }
        });

        // Add command to refresh tasks
        this.addCommand({
            id: 'refresh-today-tasks',
            name: 'Refresh today\'s tasks',
            callback: () => {
                this.refreshTasks();
            }
        });

        // Add settings tab
        this.addSettingTab(new TickTickTodaySettingTab(this.app, this));

        // Auto-open the view on startup
        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });

        // Setup auto-refresh
        if (this.settings.autoRefresh) {
            this.setupAutoRefresh();
        }
    }

    onunload() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Clean up JXA script files
        this.cleanupJXAScripts();
    }

    getPluginDir(): string {
        let basePath;
        let relativePath;
        // base path
        if (this.app.vault.adapter instanceof FileSystemAdapter) {
            basePath = this.app.vault.adapter.getBasePath();
        } else {
            throw new Error('Cannot determine base path.');
        }
        // relative path
        relativePath = `${this.app.vault.configDir}/plugins/ticktick-today`;
        // absolute path
        return `${basePath}/${relativePath}`;
    }

    getAbsolutePath(fileName: string): string {
        return `${this.getPluginDir()}/${fileName}`;
    }

    private async createJXAScripts() {
        try {
            const pluginDir = this.getPluginDir();
            // Create fetch script
            const fetchScript = `
function run() {
    try {
        const app = Application('${this.settings.tickTickAppName}');
        
        // Fetch today's tasks
        const todayTasks = app.todayTasks();
        
        // Fetch all project information
        const projects = app.projects();
        
        // Return combined tasks and project data
        return JSON.stringify({
            tasks: todayTasks,
            projects: projects,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        return JSON.stringify({ 
            error: e.toString(),
            timestamp: new Date().toISOString()
        });
    }
}
`;

            // Create toggle script
            const toggleScript = `
function run(argv) {
    try {
        if (argv.length === 0) {
            return JSON.stringify({
                success: false,
                error: 'Task ID is required'
            });
        }
        
        const taskId = argv[0];
        const app = Application('${this.settings.tickTickAppName}');
        
        // Use the working toggleTask method
        const result = app.toggleTask(taskId);
        
        return JSON.stringify({
            success: true,
            taskId: taskId,
            result: result,
            message: 'Task toggled successfully'
        });
        
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: error.toString(),
            taskId: argv[0] || 'unknown'
        });
    }
}
`;

            // Write script files
            const fetchPath = path.join(pluginDir, 'ticktick-fetch.js');
            const togglePath = path.join(pluginDir, 'ticktick-toggle.js');

            fs.writeFileSync(fetchPath, fetchScript);
            fs.writeFileSync(togglePath, toggleScript);

            this.jxaScriptPaths = {
                fetch: fetchPath,
                toggle: togglePath
            };

            console.log('JXA scripts created:', this.jxaScriptPaths);
        } catch (error) {
            console.error('Failed to create JXA scripts:', error);
            new Notice('Failed to create JXA scripts: ' + error);
        }
    }

    private cleanupJXAScripts() {
        if (!this.jxaScriptPaths) return;

        try {
            if (fs.existsSync(this.jxaScriptPaths.fetch)) {
                fs.unlinkSync(this.jxaScriptPaths.fetch);
            }

            if (fs.existsSync(this.jxaScriptPaths.toggle)) {
                fs.unlinkSync(this.jxaScriptPaths.toggle);
            }

            console.log('JXA scripts cleaned up');
        } catch (error) {
            console.error('Failed to cleanup JXA scripts:', error);
        }
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_TODAY_TASKS);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            leaf = workspace.getRightLeaf(false);
            await leaf?.setViewState({ type: VIEW_TYPE_TODAY_TASKS, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async refreshTasks() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TODAY_TASKS);
        leaves.forEach(leaf => {
            if (leaf.view instanceof TodayTasksView) {
                leaf.view.refreshTasks();
            }
        });
    }

    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        if (this.settings.autoRefresh && this.settings.refreshInterval > 0) {
            this.refreshInterval = setInterval(() => {
                this.refreshTasks();
            }, this.settings.refreshInterval * 60 * 1000);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.setupAutoRefresh();

        // Recreate JXA scripts with updated settings
        await this.createJXAScripts();
    }

    async getTodaysTasks(): Promise<Task[]> {
        return await this.getTickTickTasks();
    }

    private async getTickTickTasks(): Promise<Task[]> {
        try {
            // Check if we're on macOS and can use JXA
            if (!Platform.isMacOS) {
                new Notice('TickTick integration requires macOS');
                return [];
            }

            if (!this.jxaScriptPaths) {
                new Notice('JXA scripts are not initialized');
                return [];
            }

            return new Promise((resolve) => {
                exec(`osascript -l JavaScript "${this.jxaScriptPaths!.fetch}"`, (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        console.error('TickTick JXA Error:', error);
                        new Notice('Unable to connect to the TickTick app: ' + error.message);
                        resolve([]);
                        return;
                    }

                    try {
                        const result = JSON.parse(stdout.trim());

                        if (result.error) {
                            console.error('TickTick API Error:', result.error);
                            new Notice('TickTick API error: ' + result.error);
                            resolve([]);
                            return;
                        }

                        // Update the project cache
                        if (result.projects) {
                            this.updateProjectsCache(result.projects);
                        }

                        // Parse the TickTick response format
                        const tickTickTasks: Task[] = this.parseTickTickResponse(result.tasks || result);
                        // new Notice(`Fetched ${tickTickTasks.length} tasks for today`);
                        resolve(this.sortTasks(tickTickTasks));
                    } catch (parseError) {
                        console.error('Parse Error:', parseError);
                        new Notice('Failed to parse TickTick data: ' + parseError);
                        resolve([]);
                    }
                });
            });
        } catch (error) {
            console.error('TickTick Integration Error:', error);
            new Notice('TickTick integration failed: ' + error);
            return [];
        }
    }

    private parseTickTickResponse(response: any): Task[] {
        const tasks: Task[] = [];

        try {
            // Parse the JSON string response from TickTick
            const data = typeof response === 'string' ? JSON.parse(response) : response;

            // The response is an array of date groups
            if (Array.isArray(data)) {
                data.forEach((dateGroup: any) => {
                    // Each dateGroup has a 'tasks' array
                    if (dateGroup.tasks && Array.isArray(dateGroup.tasks)) {
                        dateGroup.tasks.forEach((task: any) => {
                            const taskObj: Task = {
                                text: task.title || 'Untitled Task',
                                completed: task.status === 2, // TickTick uses status 2 for completed tasks
                                priority: this.convertTickTickPriority(task.priority || 0),
                                dueDate: task.dueDate || task.startDate || '',
                                id: task.id || '',
                                project: this.getProjectName(task.projectId),
                                projectId: task.projectId || '', // Store the original project ID
                                tags: task.tags || [],
                                pinned: task.pinnedTime && task.pinnedTime !== "-1" // TickTick uses pinnedTime field
                            };

                            tasks.push(taskObj);
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error parsing TickTick response:', error);
            new Notice('Error parsing task data: ' + error);
        }

        return tasks;
    }

    private updateProjectsCache(projects: any): void {
        try {
            // Parse project data (may be provided as a string)
            const projectsData = typeof projects === 'string'
                ? JSON.parse(projects)
                : projects;

            if (Array.isArray(projectsData)) {
                projectsData.forEach((project: any) => {
                    if (project.id && project.name) {
                        this.projectsCache.set(project.id, project.name);
                    }
                });
                console.log('Projects cache updated:', this.projectsCache);
            }
        } catch (error) {
            console.error('Error updating projects cache:', error);
        }
    }

    private getProjectName(projectId: string): string {
        if (!projectId) return '';

        // First try to get the real project name from the cache
        if (this.projectsCache.has(projectId)) {
            const projectName = this.projectsCache.get(projectId) || '';
            return projectName;
        }

        // If the project ID contains inbox, treat it as the Inbox
        if (projectId.includes('inbox')) {
            return 'Inbox';
        }

        // Fall back to the last 8 characters of the project ID
        return `Project ${projectId.slice(-8)}`;
    }

    private convertTickTickPriority(priority: number): string {
        switch (priority) {
            case 5: return '!!!'; // High priority
            case 3: return '!!';  // Medium priority  
            case 1: return '!';   // Low priority
            default: return '';   // No priority
        }
    }

    private sortTasks(tasks: Task[]): Task[] {
        return tasks.sort((a, b) => {
            // Completed tasks go to bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Pinned tasks go to top (among non-completed tasks)
            if (a.pinned !== b.pinned) {
                return a.pinned ? -1 : 1;
            }

            // Sort by due date (earliest first)
            if (a.dueDate && b.dueDate) {
                const dateA = new Date(a.dueDate).getTime();
                const dateB = new Date(b.dueDate).getTime();
                if (dateA !== dateB) {
                    return dateA - dateB;
                }
            } else if (a.dueDate && !b.dueDate) {
                return -1; // Tasks with due date come first
            } else if (!a.dueDate && b.dueDate) {
                return 1; // Tasks with due date come first
            }

            // Sort by priority as secondary criteria
            const priorityOrder = { '!!!': 0, '!!': 1, '!': 2, 'A': 3, 'B': 4, 'C': 5, '': 6 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 6;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 6;

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            // Sort alphabetically as final criteria
            return a.text.localeCompare(b.text);
        });
    }
}

class TodayTasksView extends ItemView {
    plugin: TickTickTodayPlugin;
    private tasks: Task[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: TickTickTodayPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPE_TODAY_TASKS;
    }

    getDisplayText() {
    return "Today's tasks";
    }

    getIcon() {
        return "calendar-check";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('ticktick-today-view');

        // Header with link to TickTick "Today" smart list
        const header = container.createEl("h4");
        const link = header.createEl("a", {
            text: "Today's tasks",
            href: "ticktick://v1/show?smartlist=today",
            cls: "ticktick-link"
        });
        link.target = "_blank";

        await this.refreshTasks(false);
    }

    async onClose() {
        // Nothing to clean up
    }

    async refreshTasks(showNotice: boolean = true, isManual: boolean = false) {
        this.tasks = await this.plugin.getTodaysTasks();
        this.renderTasks();
        // Show refresh notification:
        // - Always show for manual refresh
        // - For auto refresh, respect the settings
        if (showNotice && (isManual || this.plugin.settings.showRefreshNotice)) {
            new Notice('Today refreshed');
        }
    }

    private renderTasks() {
        const container = this.containerEl.children[1];

        // Clear previous content except the header
        const header = container.querySelector('h4');
        container.empty();
        if (header) {
            container.appendChild(header);
        } else {
            container.createEl("h4", { text: "Today's tasks" });
        }

        // Add refresh button
        const refreshBtn = container.createEl("button", {
            text: "🔄 Refresh",
            cls: "mod-cta ticktick-refresh-btn"
        });
        refreshBtn.addEventListener('click', () => this.refreshTasks(true, true));

        // Add task count
        const completedCount = this.tasks.filter(t => t.completed).length;
        const totalCount = this.tasks.length;

        if (this.tasks.length === 0) {
            container.createEl("p", {
                text: "No tasks for today! 🎉",
                cls: "ticktick-empty-state"
            });
            return;
        }

        // Group tasks by completion status
        const incompleteTasks = this.tasks.filter(t => !t.completed);
        const completedTasks = this.tasks.filter(t => t.completed);

        // Render incomplete tasks
        if (incompleteTasks.length > 0) {
            const incompleteSection = container.createEl("div", { cls: "ticktick-task-section" });
            incompleteSection.createEl("h5", { text: `📋 To-do (${incompleteTasks.length})` });
            this.renderTaskList(incompleteSection, incompleteTasks);
        }

        // Render completed tasks
        if (completedTasks.length > 0) {
            const completedSection = container.createEl("div", { cls: "ticktick-task-section" });
            completedSection.createEl("h5", { text: `✅ Completed (${completedTasks.length})` });
            this.renderTaskList(completedSection, completedTasks);
        }
    }

    private renderTaskList(container: HTMLElement, tasks: Task[]) {
        const taskList = container.createEl("ul", { cls: "ticktick-task-list" });

        tasks.forEach(task => {
            const taskItem = taskList.createEl("li", { cls: "ticktick-task-item" });

            if (task.completed) {
                taskItem.addClass("ticktick-task-completed");
            }

            // Checkbox
            const checkbox = taskItem.createEl("input", {
                type: "checkbox",
                cls: "ticktick-task-checkbox"
            });
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', async (event) => {
                event.stopPropagation();
                task.completed = checkbox.checked;

                if (task.completed) {
                    taskItem.addClass("ticktick-task-completed");
                } else {
                    taskItem.removeClass("ticktick-task-completed");
                }

                try {
                    await this.toggleTask(task);

                    if (task.completed) {
                        this.tasks = this.tasks.filter(t => t !== task);
                        this.renderTasks();
                        return;
                    }
                } catch (error) {
                    task.completed = !task.completed;
                    checkbox.checked = task.completed;
                    if (task.completed) {
                        taskItem.addClass("ticktick-task-completed");
                    } else {
                        taskItem.removeClass("ticktick-task-completed");
                    }
                    console.error('Toggle failed:', error);
                }
            });

            // Task content container
            const taskContent = taskItem.createEl("div", { cls: "ticktick-task-content" });

            // Task text (clickable)
            const taskText = taskContent.createEl("div", {
                cls: "ticktick-task-text"
            });

            if (task.id) {
                // Create a clickable link
                const taskLink = taskText.createEl("a", {
                    text: task.text,
                    cls: "ticktick-task-link"
                });
                const projectId = task.projectId || 'inbox'; // Use inbox as the default when no project ID is available
                taskLink.href = `https://dida365.com/webapp/#p/${projectId}/tasks/${task.id}`;
                taskLink.target = "_blank";
                taskLink.addEventListener('click', (event) => {
                    event.stopPropagation();
                    // Use Obsidian's external link handling
                    window.open(`https://dida365.com/webapp/#p/${projectId}/tasks/${task.id}`, '_blank');
                });
            } else {
                // If no ID is available, render plain text
                taskText.textContent = task.text;
            }

            // Meta information (project + datetime)
            const metaInfo = [];

            if (task.project) {
                metaInfo.push(task.project);
            }

            if (task.dueDate) {
                const dateStr = this.formatDateTime(task.dueDate);
                if (dateStr) {
                    metaInfo.push(dateStr);
                }
            }

            if (metaInfo.length > 0) {
                const taskMeta = taskContent.createEl("div", { cls: "ticktick-task-meta" });

                if (task.project) {
                    taskMeta.createEl("span", {
                        text: task.project,
                        cls: "ticktick-task-project"
                    });
                }

                if (task.dueDate) {
                    const dateStr = this.formatDateTime(task.dueDate);
                    if (dateStr) {
                        taskMeta.createEl("span", {
                            text: dateStr,
                            cls: "ticktick-task-datetime"
                        });
                    }
                }
            }
        });
    }

    private async toggleTask(task: Task) {
        if (task.file) {
            // Handle Obsidian tasks
            const file = this.app.vault.getAbstractFileByPath(task.file);
            if (file instanceof TFile && typeof task.line === 'number' && task.line > 0) {
                const lineIndex = task.line - 1;
                let lineProcessed = false;

                await this.app.vault.process(file, (data) => {
                    const lines = data.split('\n');

                    if (lineIndex < 0 || lineIndex >= lines.length) {
                        return data;
                    }

                    const currentLine = lines[lineIndex];
                    const checkboxPattern = task.completed ? /\[ \]/ : /\[[xX]\]/;
                    const replacement = task.completed ? '[x]' : '[ ]';
                    const updatedLine = currentLine.replace(checkboxPattern, replacement);

                    lines[lineIndex] = updatedLine;
                    lineProcessed = true;

                    return lines.join('\n');
                });

                if (!lineProcessed) {
                    throw new Error(`Failed to toggle task in file ${task.file} at line ${task.line}`);
                }

                new Notice(`Task ${task.completed ? 'completed' : 'uncompleted'}!`);
            }
        } else if (task.id) {
            // Handle TickTick tasks
            await this.toggleTickTickTask(task);
        }
    }

    private async toggleTickTickTask(task: Task) {
        try {
            if (!task.id) {
                throw new Error('Missing task ID');
            }

            if (!this.plugin.getJXAScriptPaths()) {
                throw new Error('JXA scripts are not initialized');
            }

            const scriptPaths = this.plugin.getJXAScriptPaths()!;

            return new Promise<void>((resolve) => {
                exec(`osascript -l JavaScript "${scriptPaths.toggle}" "${task.id}"`, (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        console.error('TickTick Toggle Error:', error);
                        new Notice('Failed to toggle TickTick task: ' + error.message);
                        resolve();
                        return;
                    }

                    try {
                        const result = JSON.parse(stdout.trim());

                        if (result.success) {
                            new Notice(`Task "${task.text}" status toggled`);
                            console.log('TickTick toggle successful:', result);
                        } else {
                            console.error('TickTick Toggle Failed:', result.error);
                            new Notice('Failed to toggle task status: ' + result.error);
                        }
                    } catch (parseError) {
                        console.error('Parse Toggle Result Error:', parseError);
                        new Notice('Failed to parse toggle result');
                    }

                    resolve();
                });
            });
        } catch (error) {
            console.error('TickTick Toggle Integration Error:', error);
            new Notice('TickTick task toggle failed: ' + error);
            throw error;
        }
    }

    private formatDateTime(dateString: string): string {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            // Calculate the number of days between today and the task date
            const diffTime = taskDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Build the time suffix if a specific time is provided
            const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
            const timeStr = hasTime
                ? ` at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                : '';

            if (diffDays === 0) {
                return `Today${timeStr}`;
            } else if (diffDays === 1) {
                return `Tomorrow${timeStr}`;
            } else if (diffDays === -1) {
                return `Yesterday${timeStr}`;
            } else if (diffDays > 0) {
                return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}${timeStr}`;
            } else {
                const daysAgo = Math.abs(diffDays);
                return `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago${timeStr}`;
            }
        } catch (error) {
            return '';
        }
    }
}

class TickTickTodaySettingTab extends PluginSettingTab {
    plugin: TickTickTodayPlugin;

    constructor(app: App, plugin: TickTickTodayPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Auto refresh')
            .setDesc('Automatically refresh tasks at regular intervals')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoRefresh)
                .onChange(async (value) => {
                    this.plugin.settings.autoRefresh = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Refresh interval')
            .setDesc('How often to refresh tasks (in minutes)')
            .addSlider(slider => slider
                .setLimits(1, 60, 1)
                .setValue(this.plugin.settings.refreshInterval)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.refreshInterval = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('TickTick app name')
            .setDesc('Name of the TickTick application (default: TickTick)')
            .addText(text => text
                .setPlaceholder('TickTick')
                .setValue(this.plugin.settings.tickTickAppName)
                .onChange(async (value) => {
                    this.plugin.settings.tickTickAppName = value || 'TickTick';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show auto-refresh notice')
            .setDesc('Display a notification when tasks are automatically refreshed (manual refresh always shows notice)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showRefreshNotice)
                .onChange(async (value) => {
                    this.plugin.settings.showRefreshNotice = value;
                    await this.plugin.saveSettings();
                }));
    }
}
