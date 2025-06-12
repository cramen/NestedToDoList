import React from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskView } from './TaskView';

interface TaskTreeProps {
  tasks: Task[];
  onUpdate: (id: number, updates: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  onNavigateToParent?: (taskId: number) => void;
  onNavigateToChild?: (taskId: number) => void;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  onNavigateToParent,
  onNavigateToChild,
}) => {
  return (
    <TaskView
      tasks={tasks}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onCreateTask={onCreateTask}
      onCreateSibling={onCreateSibling}
      onNavigateToParent={onNavigateToParent}
      onNavigateToChild={onNavigateToChild}
      title="Full Task Tree"
      isTreeView={true}
    />
  );
};
