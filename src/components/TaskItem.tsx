import React, { useState, useRef, useEffect } from 'react';
import { Task, UpdateTaskRequest, CreateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';
import { getRootTask } from '../utils/taskUtils';

interface TaskItemProps {
  task: Task;
  depth: number;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number) => void;
  isNavigationActive: boolean;
  isLoading: boolean;
  isEditing: boolean;
  editTitle: string;
  editDescription: string;
  setEditTitle: (title: string) => void;
  setEditDescription: (description: string) => void;
  onToggleComplete: () => Promise<void>;
  onStartEdit: () => void;
  onDelete: () => Promise<void>;
  onSaveEdit: () => Promise<void>;
  onCancelEdit: () => void;
  showSiblingForm: number | null;
  setShowSiblingForm: (id: number | null) => void;
  showSubtaskForm: number | null;
  setShowSubtaskForm: (id: number | null) => void;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  onCreateSubtask: (parentId: number, task: CreateTaskRequest) => Promise<void>;
  isTreeView?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggleExpand?: () => void;
  allTasks?: Task[];
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  depth,
  selectedTaskId,
  setSelectedTaskId,
  isNavigationActive,
  isLoading,
  isEditing,
  editTitle,
  editDescription,
  setEditTitle,
  setEditDescription,
  onToggleComplete,
  onStartEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  showSiblingForm,
  setShowSiblingForm,
  showSubtaskForm,
  setShowSubtaskForm,
  onCreateSibling,
  onCreateSubtask,
  isTreeView = false,
  isExpanded = false,
  hasChildren = false,
  onToggleExpand,
  allTasks = [],
}) => {
  const taskRef = useRef<HTMLDivElement>(null);
  const rootTask = allTasks.length > 0 ? getRootTask(allTasks, task.id) : null;

  useEffect(() => {
    if (isNavigationActive && selectedTaskId === task.id && taskRef.current) {
      taskRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedTaskId, isNavigationActive, task.id]);

  const indentClass = `ml-${Math.min(depth * 4, 16)}`;
  const isSelected = isNavigationActive && selectedTaskId === task.id;

  return (
    <div
      ref={taskRef}
      className={`${indentClass} transition-all duration-200`}
    >
      <div
        className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Expand/Collapse button */}
          {isTreeView && hasChildren && (
            <button
              onClick={onToggleExpand}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
            </button>
          )}

          {/* Completion checkbox */}
          <button
            onClick={onToggleComplete}
            disabled={isLoading}
            className="mt-1"
          >
            <i className={`fas ${task.isCompleted ? 'fa-check-square text-green-500' : 'fa-square text-gray-400'}`}></i>
          </button>

          {/* Task content */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveEdit}
                    disabled={!editTitle.trim() || isLoading}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={onCancelEdit}
                    disabled={isLoading}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  {rootTask && rootTask.id !== task.id && (
                    <span className="text-xs text-gray-500">
                      (in {rootTask.title})
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className={`text-sm mt-1 ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={onStartEdit}
                    className="text-xs text-blue-500 hover:text-blue-700 p-1 rounded"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => setShowSubtaskForm(task.id)}
                    className="text-xs text-green-500 hover:text-green-700 p-1 rounded"
                  >
                    <i className="fas fa-level-down-alt"></i>
                  </button>
                  <button
                    onClick={() => setShowSiblingForm(task.id)}
                    className="text-xs text-purple-500 hover:text-purple-700 p-1 rounded"
                  >
                    <i className="fas fa-plus-square"></i>
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-xs text-red-500 hover:text-red-700 p-1 rounded"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                {showSiblingForm === task.id && (
                  <TaskForm
                    onSubmit={async (sibling) => {
                      await onCreateSibling(task.id, sibling);
                    }}
                    onCancel={() => setShowSiblingForm(null)}
                    placeholder="Enter sibling task title..."
                  />
                )}
                {showSubtaskForm === task.id && (
                  <TaskForm
                    onSubmit={async (subtask) => {
                      await onCreateSubtask(task.id, subtask);
                    }}
                    onCancel={() => setShowSubtaskForm(null)}
                    parentId={task.id}
                    placeholder="Enter subtask title..."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
