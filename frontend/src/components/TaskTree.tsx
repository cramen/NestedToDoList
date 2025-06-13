import React from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import { TaskView } from './TaskView';

interface TaskTreeProps {
  tasks: Task[];
  onUpdate: (id: number, updates: UpdateTaskRequest) => Promise<Task>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<Task>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<Task>;
  onCreateSubtask: (parentId: number, task: CreateTaskRequest) => Promise<Task>;
  onNavigateToParent?: (taskId: number) => void;
  onNavigateToChild?: (taskId: number) => void;
  title?: string;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  onCreateSubtask,
  onNavigateToParent,
  onNavigateToChild,
  title = "Full Task Tree",
}) => {
  return (
    <TaskView
      tasks={tasks}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onCreateTask={onCreateTask}
      onCreateSibling={onCreateSibling}
      onCreateSubtask={onCreateSubtask}
      onNavigateToParent={onNavigateToParent}
      onNavigateToChild={onNavigateToChild}
      title={title}
      isTreeView={true}
    />
  );
};
