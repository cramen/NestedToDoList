import { useEffect, useRef, useState } from 'react';
import { Task } from '../types/Task';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTasks: Task[];
  onSelectTask: (taskId: number) => void;
}

// Helper function to get all tasks including nested ones
const getAllTasks = (tasks: Task[]): Task[] => {
  const result: Task[] = [];
  
  const traverse = (task: Task) => {
    result.push(task);
    if (task.children && task.children.length > 0) {
      task.children.forEach(traverse);
    }
  };
  
  tasks.forEach(traverse);
  return result;
};

export const SearchModal = ({ isOpen, onClose, allTasks, onSelectTask }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all tasks including nested ones
  const allTasksFlat = getAllTasks(allTasks);

  // Filter tasks based on search query
  const filteredTasks = allTasksFlat.filter(task => {
    const searchLower = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      (task.description?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(filteredTasks.length - 1, prev + 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredTasks[selectedIndex]) {
            onSelectTask(filteredTasks[selectedIndex].id);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTasks, selectedIndex, onClose, onSelectTask]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset search query when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tasks..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredTasks.map((task, index) => (
            <div
              key={task.id}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                onSelectTask(task.id);
                onClose();
              }}
            >
              <div className="font-medium">{task.title}</div>
              {task.description && (
                <div className="text-sm text-gray-600 truncate">
                  {task.description}
                </div>
              )}
            </div>
          ))}
          {filteredTasks.length === 0 && (
            <div className="px-4 py-2 text-gray-500 text-center">
              No tasks found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 