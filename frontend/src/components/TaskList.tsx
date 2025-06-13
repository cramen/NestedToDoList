import React from 'react';
import { Task, CreateTaskRequest } from '../types/Task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number) => void;
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
  onSaveEdit: (taskId: number) => Promise<void>;
  onCancelEdit: () => void;
  showSiblingFormId: number | null;
  setShowSiblingFormId: (id: number | null) => void;
  showSubtaskFormId: number | null;
  setShowSubtaskFormId: (id: number | null) => void;
  isTreeView?: boolean;
  expandedTasks?: Set<number>;
  onToggleExpand?: (taskId: number) => void;
  allTasks?: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedTaskId,
  setSelectedTaskId,
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
  showSiblingFormId,
  setShowSiblingFormId,
  showSubtaskFormId,
  setShowSubtaskFormId,
  isTreeView = false,
  expandedTasks = new Set(),
  onToggleExpand,
  allTasks = [],
}) => {
  const renderTask = (task: Task, depth: number = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children && task.children.length > 0;

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
          onSaveEdit={() => onSaveEdit(task.id)}
          onCancelEdit={onCancelEdit}
          showSiblingForm={showSiblingFormId === task.id ? task.id : null}
          setShowSiblingForm={setShowSiblingFormId}
          showSubtaskForm={showSubtaskFormId === task.id ? task.id : null}
          setShowSubtaskForm={setShowSubtaskFormId}
          onCreateSibling={onCreateSibling}
          onCreateSubtask={onCreateSubtask}
          isTreeView={isTreeView}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={() => onToggleExpand?.(task.id)}
          allTasks={allTasks}
        />
        {isTreeView && isExpanded && task.children && task.children.length > 0 && (
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