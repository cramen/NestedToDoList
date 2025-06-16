import { useRef, useEffect, useState } from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskForm } from './TaskForm';
import { getRootTask, getTaskPath } from '../utils/taskUtils';
import MarkdownRenderer from './MarkdownRenderer';
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
  const taskPath = allTasks.length > 0 ? getTaskPath(allTasks, task.id) : null;
  const markdownRendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNavigationActive && selectedTaskId === task.id && taskRef.current) {
      taskRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedTaskId, isNavigationActive, task.id]);

  // Handle description expand/collapse and scroll behavior
  useEffect(() => {
    const currentMarkdownElement = markdownRendererRef.current;
    if (currentMarkdownElement) {
      if (isDescriptionExpanded) {
        // Calculate dynamic maxHeight and scroll into view on expand
        const taskRect = taskRef.current?.getBoundingClientRect();
        if (taskRect) {
          const availableHeight = window.innerHeight - taskRect.top - 40; // 40px padding from bottom
          currentMarkdownElement.style.maxHeight = `${Math.max(200, availableHeight)}px`; // Min height of 200px
          currentMarkdownElement.style.overflowY = 'auto';

          // Scroll task into view to align with viewport top
          window.scrollTo({
            top: window.scrollY + taskRect.top - 20, // 20px padding from top
            behavior: 'smooth'
          });
        }
      } else {
        // Reset styles and scroll to top on collapse
        currentMarkdownElement.style.overflowY = 'hidden';
        currentMarkdownElement.style.maxHeight = '';
        currentMarkdownElement.scrollTop = 0; // Scroll to top on collapse
      }
    }
  }, [isDescriptionExpanded, task.id]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNavigationActive && selectedTaskId === task.id) {
        // Обработчик для прокрутки описания
        const descriptionScrollElement = markdownRendererRef.current; 

        if (descriptionScrollElement && isDescriptionExpanded) {
          const { scrollTop, scrollHeight, clientHeight } = descriptionScrollElement;
          const scrollStep = 30; 

          if (e.key === 'ArrowUp') {
            if (scrollTop > 0) {
              e.preventDefault();
              e.stopImmediatePropagation();
              descriptionScrollElement.scrollTop -= scrollStep;
              return;
            } else {
            }
          } else if (e.key === 'ArrowDown') {
            if (scrollTop + clientHeight < scrollHeight) {
              e.preventDefault();
              e.stopImmediatePropagation();
              descriptionScrollElement.scrollTop += scrollStep;
              return;
            }
          }
        }

        // Обработчик для разворачивания/сворачивания описания
        if (e.key === '=') {
          e.preventDefault();
          setIsDescriptionExpanded(prev => !prev);
          return; 
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsDescriptionExpanded(false);
          return;
        }
      }
    };

    if (isNavigationActive && selectedTaskId === task.id) {
      window.addEventListener('keydown', handleKeyDown, true);

      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isNavigationActive, selectedTaskId, task.id, isDescriptionExpanded]);

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

  const renderTaskPath = () => {
    if (!taskPath || taskPath.length <= 1) return null;

    const rootTask = taskPath[0];
    const parentTask = taskPath[taskPath.length - 2];

    if (taskPath.length === 2) {
      return (
        <span className="text-xs text-gray-500">
          (in {rootTask.title})
        </span>
      );
    }

    return (
      <span className="text-xs text-gray-500">
        (in {rootTask.title} ... {parentTask.title})
      </span>
    );
  };

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
              <TaskForm
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
                isOpen={isEditing}
                placeholder="Edit task title..."
                title="Edit Task"
              />
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  {renderTaskPath()}
                </div>
                {task.description && (
                  <div 
                    className={`text-sm mt-1 ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}
                  >
                    <MarkdownRenderer 
                      ref={markdownRendererRef}
                      content={task.description} 
                      maxLines={2} 
                      isExpanded={isDescriptionExpanded}
                      onToggle={setIsDescriptionExpanded}
                      scrollMaxHeight={isDescriptionExpanded ? `${Math.max(200, window.innerHeight - (taskRef.current?.getBoundingClientRect().top || 0) - 40)}px` : undefined}
                      scrollOverflowY={isDescriptionExpanded ? 'auto' : undefined}
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
                    isOpen={showSiblingForm === task.id}
                  />
                )}
                {showSubtaskForm === task.id && (
                  <TaskForm
                    onSubmit={async (subtask) => {
                      await onCreateSubtask(task.id, subtask);
                    }}
                    onCancel={() => setShowSubtaskForm(null)}
                    placeholder="Enter subtask title..."
                    isOpen={showSubtaskForm === task.id}
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
