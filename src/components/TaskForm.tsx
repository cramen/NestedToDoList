import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreateTaskRequest } from '../types/Task';

interface TaskFormProps {
  onSubmit: (task: CreateTaskRequest) => Promise<void>;
  onCancel: () => void;
  parentId?: number;
  placeholder?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  parentId,
  placeholder = "Enter task title..."
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Using useCallback to memoize handleSubmit, as it's a dependency of useEffect
  const handleSubmit = useCallback(async (e: React.FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

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
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  }, [title, description, parentId, onSubmit, onCancel]); // Dependencies for useCallback

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the event originated from within this form, specifically from its input fields
      if (formRef.current && formRef.current.contains(e.target as Node)) {
        const activeElement = document.activeElement;
        const isTextarea = activeElement instanceof HTMLTextAreaElement;

        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel(); // Directly call onCancel for Escape key
        } else if (e.key === 'Enter') {
          if (isTextarea) {
            // В textarea Enter делает перенос строки, Shift+Enter отправляет форму
            if (e.shiftKey) {
              e.preventDefault();
              // Only submit if not already loading and title is not empty
              if (!loading && title.trim()) {
                handleSubmit(e); // Pass the keyboard event to handleSubmit
              }
            }
          } else {
            // В остальных полях Enter отправляет форму
            e.preventDefault();
            // Only submit if not already loading and title is not empty
            if (!loading && title.trim()) {
              handleSubmit(e); // Pass the keyboard event to handleSubmit
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [title, loading, onCancel, handleSubmit]);

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
          />
        </div>
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <i className="fas fa-spinner fa-spin"></i>}
            {loading ? 'Creating...' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
