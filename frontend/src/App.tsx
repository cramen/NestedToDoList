import React, { useState, useEffect } from 'react';
import { TaskTree } from './components/TaskTree';
import { DeepestTasks } from './components/DeepestTasks';
import { useTasks } from './hooks/useTasks';

type ViewMode = 'deepest' | 'tree';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('deepest');
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
  } = useTasks();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <i className="fas fa-tasks text-2xl text-blue-500 mr-3"></i>
              <h1 className="text-2xl font-bold text-gray-900">Hierarchical Todo List</h1>
            </div>

            <div className="flex items-center space-x-4">
              {loading && (
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  <span className="text-sm">Loading...</span>
                </div>
              )}

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('deepest')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'deepest'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <i className="fas fa-list mr-2"></i>
                  Deepest Tasks [<span className="text-xs">[</span>]
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'tree'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <i className="fas fa-sitemap mr-2"></i>
                  Full Tree [<span className="text-xs">]</span>]
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {viewMode === 'deepest' ? (
            <DeepestTasks
              tasks={deepestTasks}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onCreateTask={createTask}
              onCreateSibling={createSiblingTask}
              onCreateSubtask={createSubtask}
              allTasks={tasks}
            />
          ) : (
            <TaskTree
              tasks={tasks}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onCreateTask={createTask}
              onCreateSibling={createSiblingTask}
              onCreateSubtask={createSubtask}
              title="Complete Task Tree"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
