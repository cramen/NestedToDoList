import React, { useEffect, useRef, useState } from 'react';
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
  isTreeView: boolean;
  allTasks?: Task[];
  onSetViewMode: (mode: 'deepest' | 'tree') => void;
  expandedTasks: Set<number>;
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
  isTreeView,
  allTasks = [],
  onSetViewMode,
  expandedTasks,
}) => {
  const taskToSelectAfterTreeSwitchRef = useRef<number | null>(null);
  const { isOpen: isSearchOpen, closeModal: closeSearch } = useSearchModal();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [isSiblingModalOpen, setIsSiblingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | undefined>();
  const taskListRef = useRef<HTMLDivElement>(null);

  const onFormClose = () => {
    nav.setIsNavigationActive(true);
    setIsNewTaskModalOpen(false);
    setIsSubtaskModalOpen(false);
    setIsSiblingModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedParentId(undefined);
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
    showNewTaskForm: false,
    showSubtaskForm: null,
    showSiblingForm: null,
    onToggleComplete: ops.handleToggleComplete,
    onToggleExpand: (task: Task) => ops.handleToggleExpand(task.id),
    onNewTask: () => setIsNewTaskModalOpen(true),
    onCreateChild: (task: Task) => {
      setSelectedParentId(task.id);
      setIsSubtaskModalOpen(true);
    },
    onCreateSibling: (task: Task) => {
      setSelectedParentId(task.id);
      setIsSiblingModalOpen(true);
    },
    onExpandAll: () => ops.handleExpandAll(tasks),
    onCollapseAll: ops.handleCollapseAll,
    onDeleteTask: (task: Task) => ops.handleDelete(task.id),
    onStartEdit: (task: Task) => {
      ops.handleStartEdit(task);
      setIsEditModalOpen(true);
    },
    expandedTasks: ops.expandedTasks,
    isTreeView: isTreeView,
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
    await ops.handleToggleComplete(task);
    
    // Remove setTimeout and manual focus logic
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

  const handleSaveEdit = async (taskId: number, title: string, description: string) => {
    await ops.handleSaveEdit(taskId, title, description);
    setIsEditModalOpen(false);
  };

  const handleNewTaskSubmit = async (task: CreateTaskRequest) => {
    const newTask = await ops.handleNewTaskSubmit(task);
    onFormClose();

    // Даем время на обновление списка задач
    setTimeout(() => {
      if (isTreeView) {
        // Найти цепочку родителей
        const newExpandedTasks = new Set(ops.expandedTasks);
        let currentTask = allTasks.find(t => t.id === newTask.id);
        while (currentTask && currentTask.parentId !== undefined) {
          newExpandedTasks.add(currentTask.parentId);
          const parentTask = allTasks.find(t => t.id === currentTask?.parentId);
          if (!parentTask) break;
          currentTask = parentTask;
        }
        ops.setExpandedTasks(newExpandedTasks);
      }
      nav.setSelectedTaskId(newTask.id);
      
      // Скроллим к новой таске
      const taskElement = document.querySelector(`[data-task-id="${newTask.id}"]`);
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  };

  const scrollToTask = (taskId: number) => {
    if (taskListRef.current) {
      const taskElement = taskListRef.current.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        const containerRect = taskListRef.current.getBoundingClientRect();
        const taskRect = taskElement.getBoundingClientRect();
        const scrollTop = taskListRef.current.scrollTop + (taskRect.top - containerRect.top) - (containerRect.height / 2) + (taskRect.height / 2);
        taskListRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleSubtaskSubmit = async (task: CreateTaskRequest) => {
    if (selectedParentId !== undefined) {
      const newTask = await onCreateSubtask(selectedParentId, task);
      onFormClose();

      // Даем время на обновление списка задач
      setTimeout(() => {
        if (isTreeView) {
          // Найти цепочку родителей
          const newExpandedTasks = new Set(ops.expandedTasks);
          // Добавляем родительский узел в раскрытые
          newExpandedTasks.add(selectedParentId);
          let currentTask = allTasks.find(t => t.id === newTask.id);
          while (currentTask && currentTask.parentId !== undefined) {
            newExpandedTasks.add(currentTask.parentId);
            const parentTask = allTasks.find(t => t.id === currentTask?.parentId);
            if (!parentTask) break;
            currentTask = parentTask;
          }
          ops.setExpandedTasks(newExpandedTasks);
        }
        nav.setSelectedTaskId(newTask.id);
        scrollToTask(newTask.id);
      }, 100);
    }
  };

  const handleSiblingSubmit = async (task: CreateTaskRequest) => {
    if (selectedParentId !== undefined) {
      const newTask = await onCreateSibling(selectedParentId, task);
      onFormClose();

      // Даем время на обновление списка задач
      setTimeout(() => {
        if (isTreeView) {
          // Найти цепочку родителей
          const newExpandedTasks = new Set(ops.expandedTasks);
          let currentTask = allTasks.find(t => t.id === newTask.id);
          while (currentTask && currentTask.parentId !== undefined) {
            newExpandedTasks.add(currentTask.parentId);
            const parentTask = allTasks.find(t => t.id === currentTask?.parentId);
            if (!parentTask) break;
            currentTask = parentTask;
          }
          ops.setExpandedTasks(newExpandedTasks);
        }
        nav.setSelectedTaskId(newTask.id);
      }, 0);
    }
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

      <TaskForm
        isOpen={isNewTaskModalOpen}
        onSubmit={handleNewTaskSubmit}
        onCancel={onFormClose}
        placeholder="Enter new task title..."
        title="Create New Task"
      />

      <TaskForm
        isOpen={isSubtaskModalOpen}
        onSubmit={handleSubtaskSubmit}
        onCancel={onFormClose}
        parentId={selectedParentId}
        placeholder="Enter subtask title..."
        title="Create Subtask"
      />

      <TaskForm
        isOpen={isSiblingModalOpen}
        onSubmit={handleSiblingSubmit}
        onCancel={onFormClose}
        parentId={selectedParentId}
        placeholder="Enter sibling task title..."
        title="Create Sibling Task"
      />

      <TaskForm
        isOpen={isEditModalOpen}
        onSubmit={async (task) => {
          if (ops.editingTask !== null) {
            await handleSaveEdit(ops.editingTask, task.title, task.description || '');
          }
        }}
        onCancel={onFormClose}
        initialTitle={ops.editTitle}
        initialDescription={ops.editDescription}
        placeholder="Edit task title..."
        title="Edit Task"
        submitButtonText="Save Changes"
        loadingButtonText="Saving..."
      />

      <NavigationHelp isTreeView={isTreeView} />

      {!tasks?.length ? (
        <div className="text-center py-8 flex flex-col items-center justify-center">
          <PenguinAnimation />
          <p className="text-lg text-gray-500">Похоже, пока нет задач.</p>
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer mt-2 focus:outline-none"
          >
            Создайте свою первую задачу, чтобы начать!
          </button>
        </div>
      ) : isTreeView ? (
        <div ref={taskListRef} className="space-y-2">
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
            onSaveEdit={handleSaveEdit}
            onCancelEdit={ops.handleCancelEdit}
            onToggleComplete={handleToggleComplete}
            onToggleExpand={(taskId: number) => ops.handleToggleExpand(taskId)}
            onCreateSubtask={async (taskId: number) => {
              setSelectedParentId(taskId);
              setIsSubtaskModalOpen(true);
            }}
            onCreateSibling={async (taskId: number) => {
              setSelectedParentId(taskId);
              setIsSiblingModalOpen(true);
            }}
            onDelete={handleDeleteWithFocus}
            expandedTasks={ops.expandedTasks}
            allTasks={allTasks}
            onSelectTask={nav.setSelectedTaskId}
            onStartEdit={ops.handleStartEdit}
          />
        </div>
      ) : (
        <div ref={taskListRef} className="space-y-2">
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
            onSaveEdit={handleSaveEdit}
            onCancelEdit={ops.handleCancelEdit}
            onToggleComplete={handleToggleComplete}
            onCreateSubtask={async (taskId: number) => {
              setSelectedParentId(taskId);
              setIsSubtaskModalOpen(true);
            }}
            onCreateSibling={async (taskId: number) => {
              setSelectedParentId(taskId);
              setIsSiblingModalOpen(true);
            }}
            onDelete={handleDeleteWithFocus}
            allTasks={allTasks}
            onSelectTask={nav.setSelectedTaskId}
            onStartEdit={ops.handleStartEdit}
            expandedTasks={expandedTasks}
          />
        </div>
      )}
    </div>
  );
};
