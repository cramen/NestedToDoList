import React, { useState } from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  isNavigationActive: boolean;
  loading?: boolean;
  onToggleComplete: (task: Task) => void;
  onStartEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => void;
  onCreateSubtask: (parentId: number, task: CreateTaskRequest) => void;
  editingTaskId?: number | null;
  editTitle?: string;
  editDescription?: string;
  setEditTitle?: (title: string) => void;
  setEditDescription?: (desc: string) => void;
  onSaveEdit?: (taskId: number) => void;
  onCancelEdit?: () => void;
  showSiblingFormId?: number | null;
  setShowSiblingFormId?: (id: number | null) => void;
  showSubtaskFormId?: number | null;
  setShowSubtaskFormId?: (id: number | null) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  isNavigationActive,
  loading,
  onToggleComplete,
  onStartEdit,
  onDelete,
  onCreateSibling,
  onCreateSubtask,
  editingTaskId,
  editTitle,
  editDescription,
  setEditTitle,
  setEditDescription,
  onSaveEdit,
  onCancelEdit,
  showSiblingFormId,
  setShowSiblingFormId,
  showSubtaskFormId,
  setShowSubtaskFormId,
}) => {
  const isEditing = editingTaskId === task.id;
  const showSiblingForm = showSiblingFormId === task.id;
  const showSubtaskForm = showSubtaskFormId === task.id;

  return (
    <div
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
        isNavigationActive && isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task)}
          disabled={typeof loading === 'number' && loading === task.id}
          className="mt-1"
        >
          <i className={`fas ${task.isCompleted ? 'fa-check-square text-green-500' : 'fa-square text-gray-400'}`}></i>
        </button>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle && setEditTitle(e.target.value)}
                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={typeof loading === 'number' && loading === task.id}
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription && setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={typeof loading === 'number' && loading === task.id}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveEdit && onSaveEdit(task.id)}
                  disabled={!editTitle?.trim() || (typeof loading === 'number' && loading === task.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {typeof loading === 'number' && loading === task.id ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={onCancelEdit}
                  disabled={typeof loading === 'number' && loading === task.id}
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
                  onClick={() => onStartEdit(task)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button
                  onClick={() => setShowSiblingFormId && setShowSiblingFormId(task.id)}
                  className="text-xs text-purple-500 hover:text-purple-700"
                >
                  <i className="fas fa-plus"></i> Add Sibling
                </button>
                <button
                  onClick={() => setShowSubtaskFormId && setShowSubtaskFormId(task.id)}
                  className="text-xs text-green-500 hover:text-green-700"
                >
                  <i className="fas fa-plus"></i> Add Subtask
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  disabled={typeof loading === 'number' && loading === task.id}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
              {showSiblingForm && (
                <TaskForm
                  onSubmit={async (taskData) => { await onCreateSibling(task.id, taskData); }}
                  onCancel={() => setShowSiblingFormId && setShowSiblingFormId(null)}
                  placeholder="Enter sibling task title..."
                />
              )}
              {showSubtaskForm && (
                <TaskForm
                  onSubmit={async (taskData) => { await onCreateSubtask(task.id, taskData); }}
                  onCancel={() => setShowSubtaskFormId && setShowSubtaskFormId(null)}
                  placeholder="Enter subtask title..."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 