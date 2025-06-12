import React from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { useTaskNavigation } from '../hooks/useTaskNavigation';
import { useTaskOperations } from '../hooks/useTaskOperations';

interface TaskViewProps {
  tasks: Task[];
  onUpdate: (id: number, updates: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  onNavigateToParent?: (taskId: number) => void;
  onNavigateToChild?: (taskId: number) => void;
  title: string;
  isTreeView?: boolean;
}

// Helper function to get flat list of visible tasks
const getVisibleTasks = (tasks: Task[], expandedTasks: Set<number>): Task[] => {
  const result: Task[] = [];
  
  const traverse = (task: Task) => {
    result.push(task);
    if (task.children && task.children.length > 0 && expandedTasks.has(task.id)) {
      task.children.forEach(traverse);
    }
  };

  tasks.forEach(traverse);
  return result;
};

export const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  onNavigateToParent,
  onNavigateToChild,
  title,
  isTreeView = false,
}) => {
  const onFormClose = () => {
    nav.setIsNavigationActive(true);
  };

  const ops = useTaskOperations({
    onUpdate,
    onDelete,
    onCreateTask,
    onCreateSibling,
    isTreeView,
    onFormClose,
  });

  const nav = useTaskNavigation(tasks, {
    onNavigateToParent,
    onNavigateToChild,
    editingTask: ops.editingTask,
    showNewTaskForm: ops.showNewTaskForm,
    showSubtaskForm: ops.showSubtaskForm,
    showSiblingForm: ops.showSiblingForm,
    onToggleComplete: ops.handleToggleComplete,
    onToggleExpand: (task) => ops.handleToggleExpand(task.id),
    onNewTask: () => ops.setShowNewTaskForm(true),
    onCreateChild: (task) => ops.setShowSubtaskForm(task.id),
    onCreateSibling: (task) => ops.setShowSiblingForm(task.id),
    onExpandAll: () => ops.handleExpandAll(tasks),
    onCollapseAll: ops.handleCollapseAll,
    onDeleteTask: (task) => ops.handleDelete(task.id),
    expandedTasks: ops.expandedTasks,
  });

  // Get flat list of visible tasks (for navigation only)
  // const visibleTasks = isTreeView ? getVisibleTasks(tasks, expandedTasks) : tasks;

  return (
    <div
      ref={nav.containerRef}
      className="space-y-4 focus:outline-none"
      tabIndex={0}
      onFocus={() => nav.setIsNavigationActive(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          nav.setIsNavigationActive(false);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {nav.isNavigationActive && tasks.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Navigation: ↑↓ move, ←→ levels, Enter toggle, E edit, N new, S sibling, C child, Del delete
              {isTreeView && ', X expand all, Z collapse all'}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isTreeView && (
            <>
              <button
                onClick={() => ops.handleExpandAll(tasks)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <i className="fas fa-expand"></i> Expand All
              </button>
              <button
                onClick={ops.handleCollapseAll}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <i className="fas fa-compress"></i> Collapse All
              </button>
            </>
          )}
          <button
            onClick={() => ops.setShowNewTaskForm(true)}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            <i className="fas fa-plus"></i> New Task
          </button>
        </div>
      </div>
      {ops.showNewTaskForm && (
        <TaskForm
          onSubmit={ops.handleNewTaskSubmit}
          onCancel={ops.handleNewTaskCancel}
          placeholder="Enter new task title..."
        />
      )}
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-tasks text-4xl mb-4 text-gray-300"></i>
          <p className="text-lg">No tasks found</p>
          <p className="text-sm">Create your first task to get started!</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          selectedTaskId={nav.selectedTaskId}
          setSelectedTaskId={nav.setSelectedTaskId}
          isNavigationActive={nav.isNavigationActive}
          loading={ops.loading}
          editingTaskId={ops.editingTask}
          editTitle={ops.editTitle}
          editDescription={ops.editDescription}
          setEditTitle={ops.setEditTitle}
          setEditDescription={ops.setEditDescription}
          onToggleComplete={ops.handleToggleComplete}
          onStartEdit={ops.handleStartEdit}
          onDelete={ops.handleDelete}
          onCreateSibling={ops.handleCreateSibling}
          onCreateSubtask={ops.handleCreateSubtask}
          onSaveEdit={ops.handleSaveEdit}
          onCancelEdit={ops.handleCancelEdit}
          showSiblingFormId={ops.showSiblingForm}
          setShowSiblingFormId={ops.setShowSiblingForm}
          showSubtaskFormId={ops.showSubtaskForm}
          setShowSubtaskFormId={ops.setShowSubtaskForm}
          isTreeView={isTreeView}
          expandedTasks={ops.expandedTasks}
          onToggleExpand={ops.handleToggleExpand}
        />
      )}
    </div>
  );
}; 