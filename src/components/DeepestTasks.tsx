import React from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import { TaskView } from './TaskView';

interface DeepestTasksProps {
  tasks: Task[];
  onUpdate: (id: number, updates: UpdateTaskRequest) => Promise<Task>;
  onDelete: (id: number) => Promise<void>;
  onCreateTask: (task: CreateTaskRequest) => Promise<Task>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<Task>;
  onCreateSubtask: (parentId: number, task: CreateTaskRequest) => Promise<Task>;
  allTasks?: Task[];
}

export const DeepestTasks: React.FC<DeepestTasksProps> = ({
  tasks,
  onUpdate,
  onDelete,
  onCreateTask,
  onCreateSibling,
  onCreateSubtask,
  allTasks = [],
}) => {
  return (
    <TaskView
      tasks={tasks}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onCreateTask={onCreateTask}
      onCreateSibling={onCreateSibling}
      onCreateSubtask={onCreateSubtask}
      title="Deepest Level Tasks"
      allTasks={allTasks}
    />
  );
};
