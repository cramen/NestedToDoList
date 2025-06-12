import React, { useState, useEffect, useRef } from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';

interface TaskTreeProps {
  tasks: Task[];
  onUpdate: (id: number, updates: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  title: string;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  title,
}) => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [flattenedTasks, setFlattenedTasks] = useState<Task[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Флаттенинг дерева задач для навигации
  const flattenTasks = (taskList: Task[], depth: number = 0): Task[] => {
    const result: Task[] = [];

    taskList.forEach(task => {
      result.push({ ...task, depth } as Task & { depth: number });

      if (expandedTasks.has(task.id) && task.children && task.children.length > 0) {
        result.push(...flattenTasks(task.children, depth + 1));
      }
    });

    return result;
  };

  // Обновление плоского списка при изменении задач или раскрытых элементов
  useEffect(() => {
    const flattened = flattenTasks(tasks);
    setFlattenedTasks(flattened);

    // Если выбранная задача больше не видна, сбросить выбор
    if (selectedTaskId && !flattened.find(t => t.id === selectedTaskId)) {
      setSelectedTaskId(flattened.length > 0 ? flattened[0].id : null);
    }
  }, [tasks, expandedTasks, selectedTaskId]);

  // Инициализация выбранной задачи
  useEffect(() => {
    if (flattenedTasks.length > 0 && selectedTaskId === null) {
      setSelectedTaskId(flattenedTasks[0].id);
    }
  }, [flattenedTasks, selectedTaskId]);

  // Фокусировка на контейнере при монтировании
  useEffect(() => {
    if (containerRef.current && tasks.length > 0) {
      containerRef.current.focus();
      setIsNavigationActive(true);
    }
  }, [tasks.length]);

  // Прокрутка к выбранной задаче
  useEffect(() => {
    if (selectedTaskId && taskRefs.current[selectedTaskId]) {
      taskRefs.current[selectedTaskId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedTaskId]);

  // Обработка навигации клавиатурой
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорировать навигацию если активна форма
      if (showNewTaskForm) {
        return;
      }

      if (!isNavigationActive || flattenedTasks.length === 0 || selectedTaskId === null) {
        return;
      }

      const currentIndex = flattenedTasks.findIndex(t => t.id === selectedTaskId);
      if (currentIndex === -1) return;

      const currentTask = flattenedTasks[currentIndex];

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedTaskId(flattenedTasks[currentIndex - 1].id);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < flattenedTasks.length - 1) {
            setSelectedTaskId(flattenedTasks[currentIndex + 1].id);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          // Раскрыть текущую задачу если у неё есть дети
          if (currentTask.children && currentTask.children.length > 0) {
            if (!expandedTasks.has(currentTask.id)) {
              handleToggleChildren(currentTask.id);
            } else {
              // Если уже раскрыта, перейти к первому ребенку
              const nextIndex = currentIndex + 1;
              if (nextIndex < flattenedTasks.length) {
                setSelectedTaskId(flattenedTasks[nextIndex].id);
              }
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          // Если задача раскрыта, свернуть её
          if (expandedTasks.has(currentTask.id) && currentTask.children && currentTask.children.length > 0) {
            handleToggleChildren(currentTask.id);
          } else {
            // Иначе перейти к родителю
            const currentDepth = (currentTask as any).depth || 0;
            if (currentDepth > 0) {
              // Найти родительскую задачу (предыдущую с меньшей глубиной)
              for (let i = currentIndex - 1; i >= 0; i--) {
                const task = flattenedTasks[i] as any;
                if (task.depth < currentDepth) {
                  setSelectedTaskId(task.id);
                  break;
                }
              }
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          // Переключить статус выполнения
          handleToggleComplete(currentTask);
          break;

        case ' ':
          e.preventDefault();
          // Раскрыть/свернуть
          if (currentTask.children && currentTask.children.length > 0) {
            handleToggleChildren(currentTask.id);
          }
          break;

        case 'n':
        case 'N':
          e.preventDefault();
          setShowNewTaskForm(true);
          setIsNavigationActive(false);
          break;

        case 'c':
        case 'C':
          e.preventDefault();
          // Создать дочернюю задачу
          handleCreateChild(currentTask.id, 'New subtask');
          break;

        case 's':
        case 'S':
          e.preventDefault();
          // Создать задачу-соседа
          handleCreateSiblingWrapper(currentTask.id, 'New sibling');
          break;

        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDeleteTask(currentTask.id);
          break;

        case 'e':
        case 'E':
          e.preventDefault();
          // Можно будет добавить редактирование если потребуется
          break;

        case 'x':
        case 'X':
          e.preventDefault();
          handleExpandAll();
          break;

        case 'z':
        case 'Z':
          e.preventDefault();
          handleCollapseAll();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flattenedTasks, selectedTaskId, isNavigationActive, showNewTaskForm, expandedTasks]);

  const handleToggleChildren = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleExpandAll = () => {
    const allTaskIds = new Set<number>();
    const collectTaskIds = (taskList: Task[]) => {
      taskList.forEach(task => {
        allTaskIds.add(task.id);
        if (task.children) {
          collectTaskIds(task.children);
        }
      });
    };
    collectTaskIds(tasks);
    setExpandedTasks(allTaskIds);
  };

  const handleCollapseAll = () => {
    setExpandedTasks(new Set());
  };

  const handleCreateChild = async (parentId: number, title: string, description?: string) => {
    try {
      await onCreateTask({ title, description, parentId });
      // Автоматически раскрыть родительскую задачу
      const newExpanded = new Set(expandedTasks);
      newExpanded.add(parentId);
      setExpandedTasks(newExpanded);
    } catch (error) {
      console.error('Failed to create child task:', error);
    }
  };

  const handleCreateSiblingWrapper = async (taskId: number, title: string, description?: string) => {
    try {
      await onCreateSibling(taskId, { title, description });
    } catch (error) {
      console.error('Failed to create sibling task:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await onUpdate(task.id, { isCompleted: !task.isCompleted });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Are you sure you want to delete this task and all its subtasks?')) {
      try {
        await onDelete(taskId);
        // Если удаляемая задача была выбрана, выбрать следующую доступную
        if (selectedTaskId === taskId) {
          const currentIndex = flattenedTasks.findIndex(t => t.id === taskId);
          const nextTask = flattenedTasks[currentIndex + 1] || flattenedTasks[currentIndex - 1];
          setSelectedTaskId(nextTask ? nextTask.id : null);
        }
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleNewTaskSubmit = async (task: CreateTaskRequest) => {
    try {
      await onCreateTask(task);
      setShowNewTaskForm(false);
      setIsNavigationActive(true);
      if (containerRef.current) {
        containerRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleNewTaskCancel = () => {
    setShowNewTaskForm(false);
    setIsNavigationActive(true);
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="space-y-4 focus:outline-none"
      tabIndex={0}
      onFocus={() => setIsNavigationActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsNavigationActive(false);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {isNavigationActive && tasks.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Navigation: ↑↓ move, ←→ expand/collapse, Space toggle, Enter complete, N new, C child, S sibling, X expand all, Z collapse all, Del delete
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <i className="fas fa-expand-arrows-alt"></i> Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <i className="fas fa-compress-arrows-alt"></i> Collapse All
          </button>
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            <i className="fas fa-plus"></i> New Task
          </button>
        </div>
      </div>

      {showNewTaskForm && (
        <TaskForm
          onSubmit={handleNewTaskSubmit}
          onCancel={handleNewTaskCancel}
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
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              depth={0}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCreateChild={handleCreateChild}
              onCreateSibling={handleCreateSiblingWrapper}
              showChildren={true}
              onToggleChildren={handleToggleChildren}
              expandedTasks={expandedTasks}
              selectedTaskId={selectedTaskId}
              isNavigationActive={isNavigationActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};
