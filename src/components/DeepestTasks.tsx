import React, { useState, useEffect, useRef } from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';

interface DeepestTasksProps {
  tasks: Task[];
  onUpdate: (id: number, updates: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  onNavigateToParent?: (taskId: number) => void;
  onNavigateToChild?: (taskId: number) => void;
}

export const DeepestTasks: React.FC<DeepestTasksProps> = ({
  tasks = [],
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  onNavigateToParent,
  onNavigateToChild,
}) => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState<number | null>(null);
  const [showSubtaskForm, setShowSubtaskForm] = useState<number | null>(null);
  const [showSiblingForm, setShowSiblingForm] = useState<number | null>(null);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [isNavigationActive, setIsNavigationActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Фокусировка на контейнере при монтировании
  useEffect(() => {
    if (containerRef.current && tasks.length > 0) {
      containerRef.current.focus();
      setIsNavigationActive(true);
    }
  }, [tasks.length]);

  // Прокрутка к выбранной задаче
  useEffect(() => {
    if (tasks.length > 0 && selectedTaskIndex >= 0 && selectedTaskIndex < tasks.length) {
      const selectedTask = tasks[selectedTaskIndex];
      const taskElement = taskRefs.current[selectedTask.id];
      if (taskElement) {
        taskElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [selectedTaskIndex, tasks]);

  // Обработка навигации клавиатурой
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорировать навигацию если активна форма редактирования
      if (editingTask !== null || showNewTaskForm || showSubtaskForm !== null || showSiblingForm !== null) {
        return;
      }

      if (!isNavigationActive || tasks.length === 0) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedTaskIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedTaskIndex(prev => Math.min(tasks.length - 1, prev + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (tasks[selectedTaskIndex] && onNavigateToParent) {
            onNavigateToParent(tasks[selectedTaskIndex].id);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (tasks[selectedTaskIndex] && onNavigateToChild) {
            onNavigateToChild(tasks[selectedTaskIndex].id);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (tasks[selectedTaskIndex]) {
            handleToggleComplete(tasks[selectedTaskIndex]);
          }
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          if (tasks[selectedTaskIndex]) {
            handleStartEdit(tasks[selectedTaskIndex]);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (tasks[selectedTaskIndex]) {
            handleDelete(tasks[selectedTaskIndex].id);
          }
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          setShowNewTaskForm(true);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (tasks[selectedTaskIndex]) {
            setShowSiblingForm(tasks[selectedTaskIndex].id);
          }
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          if (tasks[selectedTaskIndex]) {
            setShowSubtaskForm(tasks[selectedTaskIndex].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tasks, selectedTaskIndex, isNavigationActive, editingTask, showNewTaskForm, showSubtaskForm, showSiblingForm, onNavigateToParent, onNavigateToChild]);

  // Сброс выбранного индекса при изменении списка задач
  useEffect(() => {
    if (selectedTaskIndex >= tasks.length) {
      setSelectedTaskIndex(Math.max(0, tasks.length - 1));
    }
  }, [tasks.length, selectedTaskIndex]);

  const handleToggleComplete = async (task: Task) => {
    setLoading(task.id);
    try {
      await onUpdate(task.id, { isCompleted: !task.isCompleted });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsNavigationActive(false);
  };

  const handleSaveEdit = async (taskId: number) => {
    if (!editTitle.trim()) return;

    setLoading(taskId);
    try {
      await onUpdate(taskId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingTask(null);
      setIsNavigationActive(true);
      // Возвращаем фокус на контейнер
      if (containerRef.current) {
        containerRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
    setIsNavigationActive(true);
    // Возвращаем фокус на контейнер
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  const handleDelete = async (taskId: number) => {
    if (confirm('Are you sure you want to delete this task and all its subtasks?')) {
      setLoading(taskId);
      try {
        await onDelete(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      } finally {
        setLoading(null);
      }
    }
  };

  const handleCreateSibling = async (taskId: number, task: CreateTaskRequest) => {
    try {
      await onCreateSibling(taskId, task);
      setShowSiblingForm(null);
      setIsNavigationActive(true);
      if (containerRef.current) {
        containerRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to create sibling task:', error);
    }
  };

  const handleCreateSubtask = async (parentId: number, task: CreateTaskRequest) => {
    try {
      await onCreateTask({ ...task, parentId });
      setShowSubtaskForm(null);
      setIsNavigationActive(true);
      if (containerRef.current) {
        containerRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to create subtask:', error);
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
        // Не убираем навигацию если фокус переходит на дочерний элемент
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsNavigationActive(false);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Deepest Level Tasks</h2>
          {isNavigationActive && tasks.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Navigation: ↑↓ move, ←→ levels, Enter toggle, E edit, N new, S sibling, C child, Del delete
            </div>
          )}
        </div>
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          <i className="fas fa-plus"></i> New Task
        </button>
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
          <p className="text-lg">No deepest level tasks found</p>
          <p className="text-sm">Create your first task or add subtasks to existing ones!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              ref={(el) => { taskRefs.current[task.id] = el; }}
              className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
                isNavigationActive && selectedTaskIndex === index
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleComplete(task)}
                  disabled={loading === task.id}
                  className="mt-1"
                >
                  <i className={`fas ${task.isCompleted ? 'fa-check-square text-green-500' : 'fa-square text-gray-400'}`}></i>
                </button>

                <div className="flex-1">
                  {editingTask === task.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading === task.id}
                        autoFocus
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        disabled={loading === task.id}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          disabled={!editTitle.trim() || loading === task.id}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                        >
                          {loading === task.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={loading === task.id}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-1 ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button
                          onClick={() => setShowSiblingForm(task.id)}
                          className="text-xs text-purple-500 hover:text-purple-700"
                        >
                          <i className="fas fa-plus"></i> Add Sibling
                        </button>
                        <button
                          onClick={() => setShowSubtaskForm(task.id)}
                          className="text-xs text-green-500 hover:text-green-700"
                        >
                          <i className="fas fa-plus"></i> Add Subtask
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={loading === task.id}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                      {showSiblingForm === task.id && (
                        <TaskForm
                          onSubmit={(taskData) => handleCreateSibling(task.id, taskData)}
                          onCancel={() => {
                            setShowSiblingForm(null);
                            setIsNavigationActive(true);
                            if (containerRef.current) {
                              containerRef.current.focus();
                            }
                          }}
                          placeholder="Enter sibling task title..."
                        />
                      )}
                      {showSubtaskForm === task.id && (
                        <TaskForm
                          onSubmit={(taskData) => handleCreateSubtask(task.id, taskData)}
                          onCancel={() => {
                            setShowSubtaskForm(null);
                            setIsNavigationActive(true);
                            if (containerRef.current) {
                              containerRef.current.focus();
                            }
                          }}
                          placeholder="Enter subtask title..."
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
