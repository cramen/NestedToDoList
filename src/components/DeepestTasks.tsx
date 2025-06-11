import React, { useState } from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';

interface DeepestTasksProps {
  tasks: Task[];
  onUpdate: (id: number, updates: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
}

export const DeepestTasks: React.FC<DeepestTasksProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
}) => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState<number | null>(null);

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

  const handleSaveEdit = async (taskId: number) => {
    if (!editTitle.trim()) return;
    
    setLoading(taskId);
    try {
      await onUpdate(taskId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingTask(null);
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

  const handleCreateSiblingWrapper = async (taskId: number, task: CreateTaskRequest) => {
    try {
      await onCreateSibling(taskId, task);
    } catch (error) {
      console.error('Failed to create sibling task:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Deepest Level Tasks</h2>
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          <i className="fas fa-plus"></i> New Task
        </button>
      </div>

      {showNewTaskForm && (
        <TaskForm
          onSubmit={onCreateTask}
          onCancel={() => setShowNewTaskForm(false)}
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
          {tasks.map((task) => (
            <div key={task.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
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
                          onClick={() => handleCreateSiblingWrapper(task.id, { title: '' })}
                          className="text-xs text-purple-500 hover:text-purple-700"
                        >
                          <i className="fas fa-plus"></i> Add Sibling
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={loading === task.id}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
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
