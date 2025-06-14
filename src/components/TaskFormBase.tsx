import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreateTaskRequest } from '../types/Task';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { Modal } from './Modal';

interface TaskFormBaseProps {
  onSubmit: (task: CreateTaskRequest) => Promise<void>;
  onCancel: () => void;
  parentId?: number;
  placeholder?: string;
  initialTitle?: string;
  initialDescription?: string;
  submitButtonText?: string;
  loadingButtonText?: string;
  isOpen: boolean;
  title?: string;
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
  isOpen,
  title,
}) => {
  const [titleValue, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens and set focus
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setIsValid(initialTitle.trim().length > 0);
      // Programmatically focus the title input when the modal opens
      titleInputRef.current?.focus();
    }
  }, [isOpen, initialTitle, initialDescription]);

  // Handle tab key to focus editor
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      // Check if the currently active element is the title input
      if (e.key === 'Tab' && !e.shiftKey && document.activeElement === titleInputRef.current) {
        e.preventDefault(); // Prevent default tab behavior

        // Find the actual textarea element inside MDEditor and focus it
        const editorTextarea = editorRef.current?.querySelector('textarea');
        if (editorTextarea) {
          // Use setTimeout to ensure the DOM is ready for focus
          setTimeout(() => {
            editorTextarea.focus();
          }, 0);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleTabKey);
    }
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  // Update validation state when title changes
  useEffect(() => {
    setIsValid(titleValue.trim().length > 0);
  }, [titleValue]);

  const handleSubmit = useCallback(async (e: React.FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await onSubmit({
        title: titleValue.trim(),
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
  }, [titleValue, description, parentId, onSubmit, onCancel, isValid]);

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
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [titleValue, loading, handleSubmit, isValid, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            autoFocus
            tabIndex={1}
          />
        </div>
        <div ref={editorRef}>
          <MDEditor
            value={description}
            onChange={(val?: string) => setDescription(val || '')}
            placeholder="Description (optional)"
            textareaProps={{
              rows: 3,
              disabled: loading,
              tabIndex: 2,
            }}
            height={Math.max(200, (description?.split('\n').length || 1) * 24)}
            preview="edit"
            hideToolbar={true}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300"
            tabIndex={4}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            tabIndex={3}
          >
            {loading && <i className="fas fa-spinner fa-spin"></i>}
            {loading ? loadingButtonText : submitButtonText}
          </button>
        </div>
      </form>
    </Modal>
  );
}; 