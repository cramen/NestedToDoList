import React from 'react';
import { CreateTaskRequest } from '../types/Task';
import { TaskFormBase } from './TaskFormBase';

interface TaskFormProps {
  onSubmit: (task: CreateTaskRequest) => Promise<void>;
  onCancel: () => void;
  parentId?: number;
  placeholder?: string;
  isOpen: boolean;
  title?: string;
  initialTitle?: string;
  initialDescription?: string;
  submitButtonText?: string;
  loadingButtonText?: string;
}

export const TaskForm: React.FC<TaskFormProps> = (props) => {
  return (
    <TaskFormBase
      {...props}
      submitButtonText={props.submitButtonText || "Create Task"}
      loadingButtonText={props.loadingButtonText || "Creating..."}
    />
  );
};
