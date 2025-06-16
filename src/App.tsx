import { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskView } from './components/TaskView';
import { Task } from './types/Task';
import { TaskForm } from './components/TaskForm';

type ViewMode = 'deepest' | 'tree';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('deepest');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const {
    tasks,
    deepestTasks,
    loading,
    error,
    createTask,
    createSiblingTask,
    createSubtask,
    updateTask,
    deleteTask,
    allTasksFlat,
  } = useTasks();

  const handleExpandAll = (tasks: Task[]) => {
    const allTaskIds = new Set<number>();
    const collectTaskIds = (taskList: Task[]) => {
      taskList.forEach(task => {
        allTaskIds.add(task.id);
        if (task.children) {
          collectTaskIds(task.children);
        }
      });
    };
    collectTaskIds(tasks);
    setExpandedTasks(allTaskIds);
  };

  const handleCollapseAll = () => {
    setExpandedTasks(new Set());
  };

  const handleNewTask = () => {
    setIsNewTaskModalOpen(true);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Проверяем, что фокус не находится в поле ввода
      const activeElement = document.activeElement;
      const isInputField = activeElement instanceof HTMLInputElement || 
                          activeElement instanceof HTMLTextAreaElement;
      
      if (isInputField) {
        return; // Игнорируем горячие клавиши, если фокус в поле ввода
      }

      if (event.key === '[' || event.key === 'х') {
        setViewMode('deepest');
      } else if (event.key === ']' || event.key === 'ъ') {
        setViewMode('tree');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-3"></i>
            <div>
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TaskForm
        isOpen={isNewTaskModalOpen}
        onSubmit={async (task) => {
          await createTask(task);
          setIsNewTaskModalOpen(false);
        }}
        onCancel={() => setIsNewTaskModalOpen(false)}
        placeholder="Enter new task title..."
        title="Create New Task"
      />

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <i className="fas fa-tasks text-2xl text-blue-500 mr-3"></i>
              <h1 className="text-2xl font-bold text-gray-900">{viewMode === 'deepest' ? "Deepest Tasks" : "Complete Task Tree"}</h1>
              <span className="ml-4 text-sm text-gray-500">Press H for help</span>
            </div>

            <div className="flex items-center space-x-4">
              {loading && (
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  <span className="text-sm">Loading...</span>
                </div>
              )}

              <div className="flex gap-2">
                {viewMode === 'tree' && tasks.length > 0 && (
                  <>
                    <button
                      onClick={() => handleExpandAll(tasks)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <i className="fas fa-expand"></i> Expand All
                    </button>
                    <button
                      onClick={handleCollapseAll}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <i className="fas fa-compress"></i> Collapse All
                    </button>
                  </>
                )}
                <button
                  onClick={handleNewTask}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <i className="fas fa-plus"></i> New Task
                </button>
                {viewMode === 'tree' ? (
                  <button
                    onClick={() => setViewMode('deepest')}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white shadow-sm"
                  >
                    <i className="fas fa-list mr-2"></i>
                    List View
                  </button>
                ) : (
                  <button
                    onClick={() => setViewMode('tree')}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white shadow-sm"
                  >
                    <i className="fas fa-sitemap mr-2"></i>
                    Tree View
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <TaskView
            tasks={viewMode === 'deepest' ? deepestTasks : tasks}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onCreateTask={createTask}
            onCreateSibling={createSiblingTask}
            onCreateSubtask={createSubtask}
            isTreeView={viewMode === 'tree'}
            allTasks={allTasksFlat}
            onSetViewMode={setViewMode}
            expandedTasks={expandedTasks}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
