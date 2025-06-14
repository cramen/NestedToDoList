import React, { useEffect, useState } from 'react';

interface NavigationHelpProps {
  isTreeView?: boolean;
}

export const NavigationHelp: React.FC<NavigationHelpProps> = ({ isTreeView = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'р') {
        e.preventDefault();
        setIsVisible(true);
      } else if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <div className="text-xs text-gray-500 mt-1">
        Press H for help
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">↑↓</div>
            <div>Move between tasks</div>
            
            <div className="font-medium">←→</div>
            <div>Navigate between levels</div>
            
            <div className="font-medium">Enter</div>
            <div>Toggle task completion</div>
            
            <div className="font-medium">E</div>
            <div>Edit task</div>
            
            <div className="font-medium">N</div>
            <div>Create new task</div>
            
            <div className="font-medium">S</div>
            <div>Create sibling task</div>
            
            <div className="font-medium">C</div>
            <div>Create child task</div>
            
            <div className="font-medium">Delete</div>
            <div>Delete task</div>
            
            <div className="font-medium">=</div>
            <div>Expand/collapse description</div>
            
            {isTreeView && (
              <>
                <div className="font-medium">X</div>
                <div>Expand all tasks</div>
                
                <div className="font-medium">Z</div>
                <div>Collapse all tasks</div>
              </>
            )}
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Press ESC to close
        </div>
      </div>
    </div>
  );
}; 