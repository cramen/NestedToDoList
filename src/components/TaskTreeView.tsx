import React from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskItem } from './TaskItem';

interface TaskTreeViewProps {
  tasks: Task[];
  selectedTaskId: number | null;
  isNavigationActive: boolean;
  loading: number | null;
  editingTaskId: number | null;
  editTitle: string;
  editDescription: string;
  setEditTitle: (title: string) => void;
  setEditDescription: (description: string) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onStartEdit: (task: Task) => void;
  onDelete: (taskId: number) => Promise<void>;
  onCreateSibling: (taskId: number, task: CreateTaskRequest) => Promise<void>;
  onCreateSubtask: (parentId: number, task: CreateTaskRequest) => Promise<void>;
  onSaveEdit: (taskId: number, title: string, description: string) => Promise<void>;
  onCancelEdit: () => void;
  expandedTasks: Set<number>;
  onToggleExpand: (taskId: number) => void;
  allTasks: Task[];
  onSelectTask: (taskId: number) => void;
}

export const TaskTreeView: React.FC<TaskTreeViewProps> = ({
  tasks,
  selectedTaskId,
  isNavigationActive,
  loading,
  editingTaskId,
  editTitle,
  editDescription,
  setEditTitle,
  setEditDescription,
  onToggleComplete,
  onStartEdit,
  onDelete,
  onCreateSibling,
  onCreateSubtask,
  onSaveEdit,
  onCancelEdit,
  expandedTasks,
  onToggleExpand,
  allTasks,
  onSelectTask,
}) => {
  const renderTask = (task: Task, depth: number = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <React.Fragment key={task.id}>
        <TaskItem
          task={task}
          depth={depth}
          selectedTaskId={selectedTaskId}
          isNavigationActive={isNavigationActive}
          isLoading={loading === task.id}
          isEditing={editingTaskId === task.id}
          editTitle={editTitle}
          editDescription={editDescription}
          setEditTitle={setEditTitle}
          setEditDescription={setEditDescription}
          onToggleComplete={() => onToggleComplete(task)}
          onStartEdit={() => onStartEdit(task)}
          onDelete={() => onDelete(task.id)}
          onSaveEdit={(title, description) => onSaveEdit(task.id, title, description)}
          onCancelEdit={onCancelEdit}
          onCreateSibling={onCreateSibling}
          onCreateSubtask={onCreateSubtask}
          isTreeView={true}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={() => onToggleExpand(task.id)}
          allTasks={allTasks}
          onSelectTask={onSelectTask}
        />
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-2">
            {task.children.map(child => renderTask(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-2">
      {tasks.map(task => renderTask(task))}
    </div>
  );
}; 