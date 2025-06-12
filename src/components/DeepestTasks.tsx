import React from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskView } from './TaskView';

interface DeepestTasksProps {
  tasks: Task[];
  onUpdate: (id: number, updates: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  allTasks?: Task[];
}

export const DeepestTasks: React.FC<DeepestTasksProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  allTasks = [],
}) => {
  return (
    <TaskView
      tasks={tasks}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onCreateTask={onCreateTask}
      onCreateSibling={onCreateSibling}
      title="Deepest Level Tasks"
      allTasks={allTasks}
    />
  );
};
