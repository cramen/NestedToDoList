import { useState } from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/Task';

interface UseTaskOperationsProps {
  onUpdate: (id: number, updates: UpdateTaskRequest) => Promise<Task>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<Task>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<Task>;
  onCreateSubtask: (parentId: number, task: CreateTaskRequest) => Promise<Task>;
  onFormClose?: () => void;
}

export const useTaskOperations = ({
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  onCreateSubtask,
  onFormClose,
}: UseTaskOperationsProps) => {
  const [loading, setLoading] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState<number | null>(null);
  const [showSiblingForm, setShowSiblingForm] = useState<number | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

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
  };

  const handleSaveEdit = async (taskId: number, title: string, description: string) => {
    if (!title.trim()) return;
    setLoading(taskId);
    try {
      await onUpdate(taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setEditingTask(null);
      setEditTitle('');
      setEditDescription('');
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
      const newTask = await onCreateSibling(taskId, task);
      return newTask;
    } catch (error) {
      console.error('Failed to create sibling task:', error);
      throw error;
    } finally {
      setLoading(null);
      onFormClose && onFormClose();
    }
  };

  const handleCreateSubtask = async (parentId: number, task: CreateTaskRequest) => {
    try {
      const newTask = await onCreateSubtask(parentId, task);
      return newTask;
    } catch (error) {
      console.error('Failed to create subtask:', error);
      throw error;
    } finally {
      setLoading(null);
      onFormClose && onFormClose();
    }
  };

  const handleNewTaskSubmit = async (task: CreateTaskRequest) => {
    try {
      const newTask = await onCreateTask(task);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    } finally {
      setLoading(null);
      onFormClose && onFormClose();
    }
  };

  const handleNewTaskCancel = () => {
    setShowNewTaskForm(false);
    onFormClose && onFormClose();
  };

  const handleToggleExpand = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleExpandTask = (taskId: number) => {
    setExpandedTasks(prev => {
      const newExpanded = new Set(prev).add(taskId);
      return newExpanded;
    });
  };

  const handleExpandAll = (tasks: Task[]) => {
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

  return {
    loading,
    editingTask,
    editTitle,
    editDescription,
    showNewTaskForm,
    showSubtaskForm,
    showSiblingForm,
    expandedTasks,
    setEditTitle,
    setEditDescription,
    setShowNewTaskForm,
    setShowSubtaskForm,
    setShowSiblingForm,
    handleToggleComplete,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDelete,
    handleCreateSibling,
    handleCreateSubtask,
    handleNewTaskSubmit,
    handleNewTaskCancel,
    handleToggleExpand,
    handleExpandTask,
    handleExpandAll,
    handleCollapseAll,
    setExpandedTasks,
  };
}; 