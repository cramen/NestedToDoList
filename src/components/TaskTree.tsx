import React, { useState } from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';

interface TaskTreeProps {
  tasks: Task[];
  onUpdate: (id: number, updates: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  title: string;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  title,
}) => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const handleToggleChildren = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleExpandAll = () => {
    const allTaskIds = new Set<number>();
    const collectTaskIds = (taskList: Task[]) => {
      taskList.forEach(task => {
        allTaskIds.add(task.id);
        collectTaskIds(task.children);
      });
    };
    collectTaskIds(tasks);
    setExpandedTasks(allTaskIds);
  };

  const handleCollapseAll = () => {
    setExpandedTasks(new Set());
  };

  const handleCreateChild = async (parentId: number, title: string, description?: string) => {
    await onCreateTask({ title, description, parentId });
  };

  const handleCreateSiblingWrapper = async (taskId: number, title: string, description?: string) => {
    await onCreateSibling(taskId, { title, description });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <i className="fas fa-expand-arrows-alt"></i> Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <i className="fas fa-compress-arrows-alt"></i> Collapse All
          </button>
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            <i className="fas fa-plus"></i> New Task
          </button>
        </div>
      </div>

      {showNewTaskForm && (
        <TaskForm
          onSubmit={onCreateTask}
          onCancel={() => setShowNewTaskForm(false)}
          placeholder="Enter new task title..."
        />
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-tasks text-4xl mb-4 text-gray-300"></i>
          <p className="text-lg">No tasks found</p>
          <p className="text-sm">Create your first task to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              depth={0}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCreateChild={handleCreateChild}
              onCreateSibling={handleCreateSiblingWrapper}
              showChildren={true}
              onToggleChildren={handleToggleChildren}
              expandedTasks={expandedTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
};
