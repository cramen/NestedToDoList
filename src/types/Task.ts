export interface Task {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  parentId?: number;
  position: number;
  children: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  parentId?: number;
  position?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  position?: number;
}

export interface TaskResponse {
  success: boolean;
  message: string;
  data?: Task;
}

export interface TaskListResponse {
  success: boolean;
  message: string;
  data: Task[];
}
