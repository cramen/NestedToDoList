import axios from 'axios';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskResponse, TaskListResponse } from '../types/Task';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taskApi = {
  // Get all tasks as tree
  getAllTasks: async (): Promise<Task[]> => {
    const response = await api.get<TaskListResponse>('/tasks');
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  },

  // Get deepest level tasks
  getDeepestTasks: async (): Promise<Task[]> => {
    const response = await api.get<TaskListResponse>('/tasks/deepest');
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  },

  // Get task by ID
  getTaskById: async (id: number): Promise<Task> => {
    const response = await api.get<TaskResponse>(`/tasks/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  },

  // Get task tree starting from specific task
  getTaskTree: async (id: number): Promise<Task> => {
    const response = await api.get<TaskResponse>(`/tasks/${id}/tree`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  },

  // Create new task
  createTask: async (task: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<TaskResponse>('/tasks', task);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  },

  // Create sibling task
  createSiblingTask: async (taskId: number, task: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<TaskResponse>(`/tasks/${taskId}/sibling`, task);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  },

  // Update task
  updateTask: async (id: number, updates: UpdateTaskRequest): Promise<Task> => {
    const response = await api.put<TaskResponse>(`/tasks/${id}`, updates);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message);
    }
    return response.data.data;
  },

  // Delete task
  deleteTask: async (id: number): Promise<void> => {
    const response = await api.delete<TaskResponse>(`/tasks/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  },
};
