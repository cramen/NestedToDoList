import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreateTaskRequest } from '../types/Task';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface TaskFormBaseProps {
  onSubmit: (task: CreateTaskRequest) => Promise<void>;
  onCancel: () => void;
  parentId?: number;
  placeholder?: string;
  initialTitle?: string;
  initialDescription?: string;
  submitButtonText?: string;
  loadingButtonText?: string;
}

export const TaskFormBase: React.FC<TaskFormBaseProps> = ({
  onSubmit,
  onCancel,
  parentId,
  placeholder = "Enter task title...",
  initialTitle = '',
  initialDescription = '',
  submitButtonText = 'Create Task',
  loadingButtonText = 'Creating...',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Update validation state when title changes
  useEffect(() => {
    setIsValid(title.trim().length > 0);
  }, [title]);

  // Using useCallback to memoize handleSubmit, as it's a dependency of useEffect
  const handleSubmit = useCallback(async (e: React.FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        parentId,
      });
      // Clear form and close on successful submission
      setTitle('');
      setDescription('');
      onCancel();
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setLoading(false);
    }
  }, [title, description, parentId, onSubmit, onCancel, isValid]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInEditor = activeElement?.closest('.w-md-editor') !== null;

      if (e.key === 'Enter') {
        if (isInEditor) {
          // В редакторе Shift+Enter отправляет форму
          if (e.shiftKey) {
            e.preventDefault();
            if (!loading && isValid) {
              handleSubmit(e);
            }
          }
        } else {
          // Вне редактора Enter отправляет форму
          if (!e.shiftKey) {
            e.preventDefault();
            if (!loading && isValid) {
              handleSubmit(e);
            }
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [title, loading, onCancel, handleSubmit, isValid]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-4 border rounded-lg shadow-sm">
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            autoFocus
            tabIndex={1}
          />
        </div>
        <div>
          <MDEditor
            value={description}
            onChange={(val?: string) => setDescription(val || '')}
            placeholder="Description (optional)"
            textareaProps={{
              rows: 3,
              disabled: loading,
              tabIndex: 2,
            }}
            height={Math.max(100, (description?.split('\n').length || 1) * 24)}
            preview="edit"
            hideToolbar={false}
            commands={[
              commands.bold,
              commands.italic,
              commands.unorderedListCommand,
              commands.orderedListCommand,
              commands.checkedListCommand,
              commands.quote,
              commands.code,
              commands.link,
            ]}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!isValid || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            tabIndex={3}
          >
            {loading && <i className="fas fa-spinner fa-spin"></i>}
            {loading ? loadingButtonText : submitButtonText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300"
            tabIndex={4}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}; 