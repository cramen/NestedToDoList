import React from 'react';
import { Task } from '../types/Task';

interface ClubGridCardProps {
  task: Task;
}

export const ClubGridCard: React.FC<ClubGridCardProps> = ({ task }) => {
  // Placeholder for random club icon/logo, replace with actual logic if available
  const clubIcon = `/src/assets/club-icon-${Math.floor(Math.random() * 6) + 1}.svg`; // Example of dynamic placeholder

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative overflow-hidden">
      {/* Club Icon/Logo */}
      <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200">
        <img src={clubIcon} alt="Club Icon" className="w-8 h-8 object-contain" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1 pr-16">{task.title}</h3>
      <p className="text-sm text-gray-500 mb-4">{task.description || "N подписчиков · M постов"}</p> {/* Using description for now, or default text */}

      <button
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
      >
        Написать пост
      </button>
    </div>
  );
}; 