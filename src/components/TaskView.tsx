import React, { useEffect, useRef } from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { TaskTreeView } from './TaskTreeView';
import { useTaskNavigation } from '../hooks/useTaskNavigation';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { PenguinAnimation } from './PenguinAnimation';
import { NavigationHelp } from './NavigationHelp';
import { SearchModal } from './SearchModal';
import { useSearchModal } from '../hooks/useSearchModal';

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
  isTreeView: boolean;
  allTasks?: Task[];
  onSetViewMode: (mode: 'deepest' | 'tree') => void;
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
  isTreeView,
  allTasks = [],
  onSetViewMode,
}) => {
  const taskToSelectAfterTreeSwitchRef = useRef<number | null>(null);
  const { isOpen: isSearchOpen, closeModal: closeSearch } = useSearchModal();

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
    
    // Даем время на обновление списка задач
    setTimeout(() => {
      const newVisible = isTreeView ? getVisibleTasks(tasks, ops.expandedTasks) : tasks;
      
      // Если удалили выбранную задачу
      if (prevSelected === taskId) {
        // Если есть задачи после удаленной
        if (prevIndex < newVisible.length) {
          nav.setSelectedTaskId(newVisible[prevIndex].id);
        }
        // Если удалили последнюю задачу
        else if (newVisible.length > 0) {
          nav.setSelectedTaskId(newVisible[newVisible.length - 1].id);
        }
        // Если больше нет задач
        else {
          nav.setSelectedTaskId(null);
        }
      }
    }, 0);
  };

  const handleToggleCompleteWithFocus = async (task: Task) => {
    const prevVisible = isTreeView ? getVisibleTasks(tasks, ops.expandedTasks) : tasks;
    const prevSelected = nav.selectedTaskId;
    const prevIndex = prevVisible.findIndex(t => t.id === prevSelected);
    await ops.handleToggleComplete(task);
    const newVisible = isTreeView ? getVisibleTasks(tasks, ops.expandedTasks) : tasks;
    if (!newVisible.some(t => t.id === prevSelected)) {
      if (prevIndex > 0) {
        nav.setSelectedTaskId(newVisible[prevIndex - 1]?.id ?? newVisible[0]?.id ?? null);
      } else {
        nav.setSelectedTaskId(newVisible[0]?.id ?? null);
      }
    }
  };

  const handleSearchSelect = (taskId: number) => {
    // Request App.tsx to switch to tree view
    onSetViewMode('tree');

    // Set taskToSelectAfterTreeSwitchRef immediately
    taskToSelectAfterTreeSwitchRef.current = taskId;
  };

  // useEffect to handle task selection and expansion after tree view is active
  useEffect(() => {
    if (isTreeView && taskToSelectAfterTreeSwitchRef.current !== null) {
      const taskId = taskToSelectAfterTreeSwitchRef.current;

      // Найти цепочку родителей
      const newExpandedTasks = new Set<number>();
      let currentTask = allTasks.find(t => t.id === taskId);
      while (currentTask && currentTask.parentId !== undefined) {
        newExpandedTasks.add(currentTask.parentId);
        const parentTask = allTasks.find(t => t.id === currentTask?.parentId);
        if (!parentTask) break;
        currentTask = parentTask;
      }
      // Если у выбранной задачи есть дети, раскрыть и ее
      const selectedTask = allTasks.find(t => t.id === taskId);
      if (selectedTask && selectedTask.children && selectedTask.children.length > 0) {
        newExpandedTasks.add(taskId);
      }

      ops.setExpandedTasks(newExpandedTasks);

      nav.setSelectedTaskId(taskId);

      taskToSelectAfterTreeSwitchRef.current = null;
    }
  }, [isTreeView, allTasks, ops, nav]);

  const handleToggleComplete = async (task: Task) => {
    await handleToggleCompleteWithFocus(task);
  };

  const handleSaveEdit = async (taskId: number) => {
    await ops.handleSaveEdit(taskId);
  };

  return (
    <div
      ref={nav.containerRef}
      className="space-y-4 focus:outline-none"
      tabIndex={0}
    >
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        allTasks={allTasks}
        onSelectTask={handleSearchSelect}
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {nav.isNavigationActive && tasks?.length > 0 && (
            <NavigationHelp isTreeView={isTreeView} />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSetViewMode(isTreeView ? 'deepest' : 'tree')}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <i className={`fas fa-${isTreeView ? 'list' : 'sitemap'}`}></i> {isTreeView ? 'List View' : 'Tree View'}
          </button>
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
      ) : isTreeView ? (
        <TaskTreeView
          tasks={tasks}
          selectedTaskId={nav.selectedTaskId}
          isNavigationActive={nav.isNavigationActive}
          loading={ops.loading}
          editingTaskId={ops.editingTask}
          editTitle={ops.editTitle}
          editDescription={ops.editDescription}
          setEditTitle={ops.setEditTitle}
          setEditDescription={ops.setEditDescription}
          onToggleComplete={handleToggleComplete}
          onStartEdit={ops.handleStartEdit}
          onDelete={handleDeleteWithFocus}
          onCreateSibling={ops.handleCreateSibling}
          onCreateSubtask={ops.handleCreateSubtask}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={ops.handleCancelEdit}
          showSiblingFormId={ops.showSiblingForm}
          setShowSiblingFormId={ops.setShowSiblingForm}
          showSubtaskFormId={ops.showSubtaskForm}
          setShowSubtaskFormId={ops.setShowSubtaskForm}
          expandedTasks={ops.expandedTasks}
          onToggleExpand={ops.handleToggleExpand}
          allTasks={allTasks}
          onSelectTask={nav.setSelectedTaskId}
        />
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
          onToggleComplete={handleToggleComplete}
          onStartEdit={ops.handleStartEdit}
          onDelete={handleDeleteWithFocus}
          onCreateSibling={ops.handleCreateSibling}
          onCreateSubtask={ops.handleCreateSubtask}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={ops.handleCancelEdit}
          showSiblingFormId={ops.showSiblingForm}
          setShowSiblingFormId={ops.setShowSiblingForm}
          showSubtaskFormId={ops.showSubtaskForm}
          setShowSubtaskFormId={ops.setShowSubtaskForm}
          allTasks={allTasks}
          onSelectTask={nav.setSelectedTaskId}
        />
      )}
    </div>
  );
};
