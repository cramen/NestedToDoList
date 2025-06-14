import React from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { useTaskNavigation } from '../hooks/useTaskNavigation';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { PenguinAnimation } from './PenguinAnimation';

interface TaskViewProps {
  tasks: Task[];
  onUpdate: (id: number, updates: UpdateTaskRequest) => Promise<Task>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<Task>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<Task>;
  onCreateSubtask: (parentId: number, task: CreateTaskRequest) => Promise<Task>;
  onNavigateToParent?: (taskId: number) => void;
  onNavigateToChild?: (taskId: number) => void;
  title: string;
  isTreeView?: boolean;
  allTasks?: Task[];
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
  onCreateSubtask,
  onNavigateToParent,
  onNavigateToChild,
  title,
  isTreeView = false,
  allTasks = [],
}) => {
  const onFormClose = () => {
    nav.setIsNavigationActive(true);
  };

  const ops = useTaskOperations({
    onUpdate,
    onDelete,
    onCreateTask,
    onCreateSibling,
    onCreateSubtask,
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
    onStartEdit: ops.handleStartEdit,
    expandedTasks: ops.expandedTasks,
  });

  // Patch: wrap ops.handleDelete and ops.handleToggleComplete to update focus after removal
  const handleDeleteWithFocus = async (taskId: number) => {
    const prevVisible = isTreeView ? getVisibleTasks(tasks, ops.expandedTasks) : tasks;
    const prevSelected = nav.selectedTaskId;
    const prevIndex = prevVisible.findIndex(t => t.id === prevSelected);
    await ops.handleDelete(taskId);
    const newVisible = isTreeView ? getVisibleTasks(tasks, ops.expandedTasks) : tasks;
    
    // Если задача была удалена, выбираем предыдущую задачу или первую, если предыдущей нет
    if (!newVisible.some(t => t.id === prevSelected)) {
      if (prevIndex > 0) {
        // Выбираем предыдущую задачу
        nav.setSelectedTaskId(newVisible[prevIndex - 1]?.id ?? null);
      } else if (newVisible.length > 0) {
        // Если удалена первая задача, выбираем новую первую
        nav.setSelectedTaskId(newVisible[0].id);
      } else {
        // Если больше нет задач, сбрасываем выбор
        nav.setSelectedTaskId(null);
      }
    }
  };

  const handleToggleCompleteWithFocus = async (task: Task) => {
    const prevVisible = isTreeView ? getVisibleTasks(tasks, ops.expandedTasks) : tasks;
    const prevSelected = nav.selectedTaskId;
    const prevIndex = prevVisible.findIndex(t => t.id === prevSelected);
    await ops.handleToggleComplete(task);
    const newVisible = isTreeView ? getVisibleTasks(tasks, ops.expandedTasks) : tasks;
    
    // Если задача скрылась (была выполнена), выбираем предыдущую задачу или первую, если предыдущей нет
    if (!newVisible.some(t => t.id === prevSelected)) {
      if (prevIndex > 0) {
        // Выбираем предыдущую задачу
        nav.setSelectedTaskId(newVisible[prevIndex - 1]?.id ?? null);
      } else if (newVisible.length > 0) {
        // Если скрылась первая задача, выбираем новую первую
        nav.setSelectedTaskId(newVisible[0].id);
      } else {
        // Если больше нет задач, сбрасываем выбор
        nav.setSelectedTaskId(null);
      }
    }
  };

  return (
    <div
      ref={nav.containerRef}
      className="space-y-4 focus:outline-none"
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {nav.isNavigationActive && tasks?.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Navigation: ↑↓ move, ←→ levels, Enter toggle, E edit, N new, S sibling, C child, Del delete, = expand/collapse description
              {isTreeView && ', X expand all, Z collapse all'}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isTreeView && tasks.length > 0 && (
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
      {!tasks?.length ? (
        <div className="text-center py-8 flex flex-col items-center justify-center">
          <PenguinAnimation />
          <p className="text-lg text-gray-500">Похоже, пока нет задач.</p>
          <button
            onClick={() => ops.setShowNewTaskForm(true)}
            className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer mt-2 focus:outline-none"
          >
            Создайте свою первую задачу, чтобы начать!
          </button>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          selectedTaskId={nav.selectedTaskId}
          isNavigationActive={nav.isNavigationActive}
          loading={ops.loading}
          editingTaskId={ops.editingTask}
          editTitle={ops.editTitle}
          editDescription={ops.editDescription}
          setEditTitle={ops.setEditTitle}
          setEditDescription={ops.setEditDescription}
          onToggleComplete={handleToggleCompleteWithFocus}
          onStartEdit={ops.handleStartEdit}
          onDelete={handleDeleteWithFocus}
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
          allTasks={allTasks}
          onSelectTask={nav.setSelectedTaskId}
        />
      )}
    </div>
  );
};
