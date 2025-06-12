import React, { useState } from 'react';
import { Task, UpdateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';

interface TaskItemProps {
  task: Task;
  depth: number;
  onUpdate: (id: number, updates: UpdateTaskRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateChild: (parentId: number, title: string, description?: string) => Promise<void>;
  onCreateSibling: (taskId: number, title: string, description?: string) => Promise<void>;
  showChildren?: boolean;
  onToggleChildren?: (taskId: number) => void;
  expandedTasks?: Set<number>;
  selectedTaskId?: number | null;
  isNavigationActive?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  depth,
  onUpdate,
  onDelete,
  onCreateChild,
  onCreateSibling,
  showChildren = true,
  onToggleChildren,
  expandedTasks = new Set(),
  selectedTaskId,
  isNavigationActive = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showChildForm, setShowChildForm] = useState(false);
  const [showSiblingForm, setShowSiblingForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const indentClass = `ml-${Math.min(depth * 4, 16)}`;
  const hasChildren = task.children && task.children.length > 0;
  const isExpanded = expandedTasks.has(task.id);
  const isSelected = isNavigationActive && selectedTaskId === task.id;

  const handleToggleComplete = async () => {
    setLoading(true);
    try {
      await onUpdate(task.id, { isCompleted: !task.isCompleted });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task and all its subtasks?')) {
      setLoading(true);
      try {
        await onDelete(task.id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateChild = async (childData: { title: string; description?: string }) => {
    try {
      await onCreateChild(task.id, childData.title, childData.description);
      setShowChildForm(false);
    } catch (error) {
      console.error('Failed to create child task:', error);
    }
  };

  const handleCreateSibling = async (siblingData: { title: string; description?: string }) => {
    try {
      await onCreateSibling(task.id, siblingData.title, siblingData.description);
      setShowSiblingForm(false);
    } catch (error) {
      console.error('Failed to create sibling task:', error);
    }
  };

  return (
    <div className={`${depth > 0 ? indentClass : ''}`}>
      <div className="border-l-2 border-gray-200 pl-4 mb-2">
        <div className={`bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-all ${
          isSelected
            ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg'
            : ''
        }`}>
          <div className="flex items-start gap-3">
            {/* Expand/Collapse button */}
            {hasChildren && onToggleChildren && (
              <button
                onClick={() => onToggleChildren(task.id)}
                className="mt-1 text-gray-500 hover:text-gray-700"
              >
                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
              </button>
            )}

            {/* Completion checkbox */}
            <button
              onClick={handleToggleComplete}
              disabled={loading}
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
                    disabled={loading}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={loading}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editTitle.trim() || loading}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditTitle(task.title);
                        setEditDescription(task.description || '');
                      }}
                      disabled={loading}
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
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button
                      onClick={() => setShowChildForm(true)}
                      className="text-xs text-green-500 hover:text-green-700"
                    >
                      <i className="fas fa-plus"></i> Add Subtask
                    </button>
                    <button
                      onClick={() => setShowSiblingForm(true)}
                      className="text-xs text-purple-500 hover:text-purple-700"
                    >
                      <i className="fas fa-plus"></i> Add Sibling
                    </button>
                    <button
                      onClick={handleDelete}
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

        {/* Child task form */}
        {showChildForm && (
          <div className="mt-2 ml-6">
            <TaskForm
              onSubmit={handleCreateChild}
              onCancel={() => setShowChildForm(false)}
              parentId={task.id}
              placeholder="Enter subtask title..."
            />
          </div>
        )}

        {/* Sibling task form */}
        {showSiblingForm && (
          <div className="mt-2">
            <TaskForm
              onSubmit={handleCreateSibling}
              onCancel={() => setShowSiblingForm(false)}
              placeholder="Enter sibling task title..."
            />
          </div>
        )}
      </div>

      {/* Child tasks */}
      {showChildren && hasChildren && isExpanded && (
        <div className="ml-4">
          {task.children.map((child) => (
            <TaskItem
              key={child.id}
              task={child}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              onCreateSibling={onCreateSibling}
              showChildren={showChildren}
              onToggleChildren={onToggleChildren}
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
