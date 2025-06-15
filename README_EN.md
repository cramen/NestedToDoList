# NestedTaskTracker

NestedTaskTracker is a modern task management application with support for nested structures and smart navigation. It allows you to effectively organize your tasks into a hierarchical structure and focus on current tasks.

**Try the application live here:** [https://cramen.github.io/NestedToDoList/](https://cramen.github.io/NestedToDoList/)

## Key Features

### 🎯 Focus on Current Tasks
- Displaying only leaf nodes of the task tree allows you to concentrate on specific tasks that need to be done right now
- No need to scatter your attention across the entire task tree - you only see what requires your immediate attention
- Ability to quickly switch between different levels of tasks without losing context

### 🔍 Task Search
- Fast search for tasks by title and description
- Opening the search modal with a hotkey (Cmd+F / Ctrl+F)
- Navigating search results using the keyboard
- Automatic switching to tree view and expanding the parent chain when selecting a task from search results

### 🌳 Flexible Task Structure
- Create tasks of any nesting level
- Support for subtasks and sibling tasks
- Automatic saving of task hierarchy
- Ability to view tasks both as a tree and as a flat list

### ⌨️ Convenient Keyboard Navigation
- Full support for keyboard navigation
- Hotkeys for all main actions
- Support for both English and Russian layouts
- Quick access to editing, creating, and deleting tasks

### 📝 Rich Description Formatting
- Markdown support in task descriptions
- Automatic expanding/collapsing of long descriptions
- Convenient editing with automatic input field height adjustment

### 🎨 Modern Interface
- Clean and intuitive design
- Responsive layout
- Smooth animations and transitions
- Highlighting of the active task and contextual hints

## Hotkeys

- **↑↓** - move between tasks
- **←→** - navigate between levels
- **Enter** - toggle task completion status
- **E** - edit task
- **N** - new task
- **S** - create sibling task
- **C** - create child task
- **Del** - delete task
- **=** - expand/collapse description
- **Cmd+F / Ctrl+F** - search tasks
- **X** - expand all (in tree view)
- **Z** - collapse all (in tree view)

## Advantages over other solutions

1. **Focus on current tasks**
   - Unlike other trackers where all tasks are displayed simultaneously, NestedTaskTracker allows you to focus only on current tasks
   - Reduced cognitive load by displaying only relevant information

2. **Smart navigation**
   - Full keyboard navigation support makes working with tasks fast and efficient
   - Russian layout support makes the application convenient for Russian-speaking users

3. **Flexibility of structure**
   - Ability to create tasks of any nesting depth
   - Convenient switching between different task views

4. **Modern technologies**
   - Built with React and TypeScript
   - Uses modern development practices
   - Supports Markdown for formatting

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- React Markdown
- Local Storage for data persistence

## Installation and Running

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
``` 