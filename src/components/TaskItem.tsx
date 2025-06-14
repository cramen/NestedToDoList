import { useRef, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';
import { TaskFormBase } from './TaskFormBase';
import { getRootTask } from '../utils/taskUtils';
import MarkdownRenderer from './MarkdownRenderer';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface TaskItemProps {
  task: Task;
  depth: number;
  selectedTaskId: number | null;
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
  onSaveEdit: (title: string, description: string) => Promise<void>;
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
  onSelectTask: (taskId: number) => void;
}

export const TaskItem = ({
  task,
  depth,
  selectedTaskId,
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
  onSelectTask,
}: TaskItemProps) => {
  const taskRef = useRef<HTMLDivElement>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const rootTask = allTasks.length > 0 ? getRootTask(allTasks, task.id) : null;

  useEffect(() => {
    if (isNavigationActive && selectedTaskId === task.id && taskRef.current) {
      taskRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedTaskId, isNavigationActive, task.id]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNavigationActive && selectedTaskId === task.id && e.key === '=') {
        e.preventDefault();
        setIsDescriptionExpanded(prev => !prev);
      }
    };

    if (isNavigationActive && selectedTaskId === task.id) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isNavigationActive, selectedTaskId, task.id]);

  // Handle edit form keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) {
        const activeElement = document.activeElement;
        const isInEditor = activeElement?.closest('.w-md-editor') !== null;

        if (e.key === 'Enter') {
          if (isInEditor) {
            // В редакторе Shift+Enter отправляет форму
            if (e.shiftKey) {
              e.preventDefault();
              if (!isLoading && editTitle.trim()) {
                onSaveEdit(editTitle, editDescription);
              }
            }
          } else {
            // Вне редактора Enter отправляет форму
            if (!e.shiftKey) {
              e.preventDefault();
              if (!isLoading && editTitle.trim()) {
                onSaveEdit(editTitle, editDescription);
              }
            }
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancelEdit();
        }
      }
    };

    if (isEditing) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, isLoading, editTitle, editDescription, onSaveEdit, onCancelEdit]);

  // Reset expanded state when task is deselected
  useEffect(() => {
    if (!isNavigationActive || selectedTaskId !== task.id) {
      setIsDescriptionExpanded(false);
    }
  }, [isNavigationActive, selectedTaskId, task.id]);

  const indentClass = `ml-${Math.min(depth * 4, 16)}`;
  const isSelected = isNavigationActive && selectedTaskId === task.id;

  return (
    <div
      ref={taskRef}
      className={`${indentClass} transition-all duration-200`}
      onClick={() => onSelectTask(task.id)}
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
              <TaskFormBase
                onSubmit={async (taskData) => {
                  setEditTitle(taskData.title);
                  setEditDescription(taskData.description || '');
                  await onSaveEdit(taskData.title, taskData.description || '');
                }}
                onCancel={onCancelEdit}
                initialTitle={editTitle}
                initialDescription={editDescription}
                submitButtonText="Save"
                loadingButtonText="Saving..."
              />
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
                  <div className={`text-sm mt-1 ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                    <MarkdownRenderer 
                      content={task.description} 
                      maxLines={2} 
                      isExpanded={isDescriptionExpanded}
                      onToggle={setIsDescriptionExpanded}
                    />
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={onStartEdit}
                    className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => setShowSubtaskForm(task.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded"
                  >
                    <i className="fas fa-level-down-alt"></i>
                  </button>
                  <button
                    onClick={() => setShowSiblingForm(task.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded"
                  >
                    <i className="fas fa-plus-square"></i>
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded"
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
