const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database table
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_completed BOOLEAN DEFAULT false,
        parent_id INTEGER REFERENCES tasks(id),
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Helper function to build task tree
function buildTaskTree(tasks) {
  const taskMap = new Map();
  const rootTasks = [];

  // First pass: create map of all tasks
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });

  // Second pass: build tree structure
  tasks.forEach(task => {
    if (task.parent_id === null) {
      rootTasks.push(taskMap.get(task.id));
    } else {
      const parent = taskMap.get(task.parent_id);
      if (parent) {
        parent.children.push(taskMap.get(task.id));
      }
    }
  });

  return rootTasks.sort((a, b) => a.position - b.position);
}

// Routes

// Get all tasks as tree structure
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY position');
    const tasks = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      isCompleted: row.is_completed,
      parentId: row.parent_id,
      position: row.position,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));
    
    const tree = buildTaskTree(tasks);
    res.json({ success: true, message: 'Tasks retrieved successfully', data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get deepest level tasks only
app.get('/api/tasks/deepest', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t1.* FROM tasks t1
      LEFT JOIN tasks t2 ON t1.id = t2.parent_id
      WHERE t2.id IS NULL
      ORDER BY t1.position
    `);
    
    const tasks = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      isCompleted: row.is_completed,
      parentId: row.parent_id,
      position: row.position,
      children: [],
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));
    
    res.json({ success: true, message: 'Deepest tasks retrieved successfully', data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, parentId, position = 0 } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Task title cannot be empty' });
    }
    
    const result = await pool.query(
      'INSERT INTO tasks (title, description, parent_id, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), description || null, parentId || null, position]
    );
    
    const task = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      isCompleted: result.rows[0].is_completed,
      parentId: result.rows[0].parent_id,
      position: result.rows[0].position,
      children: [],
      createdAt: result.rows[0].created_at.toISOString(),
      updatedAt: result.rows[0].updated_at.toISOString()
    };
    
    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create sibling task
app.post('/api/tasks/:id/sibling', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Task title cannot be empty' });
    }
    
    // Get the sibling task to find its parent
    const siblingResult = await pool.query('SELECT parent_id FROM tasks WHERE id = $1', [taskId]);
    if (siblingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parent task not found' });
    }
    
    const parentId = siblingResult.rows[0].parent_id;
    
    // Find the highest position among siblings
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE parent_id IS NOT DISTINCT FROM $1',
      [parentId]
    );
    const position = positionResult.rows[0].next_position;
    
    const result = await pool.query(
      'INSERT INTO tasks (title, description, parent_id, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), description || null, parentId, position]
    );
    
    const task = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      isCompleted: result.rows[0].is_completed,
      parentId: result.rows[0].parent_id,
      position: result.rows[0].position,
      children: [],
      createdAt: result.rows[0].created_at.toISOString(),
      updatedAt: result.rows[0].updated_at.toISOString()
    };
    
    res.status(201).json({ success: true, message: 'Sibling task created successfully', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, isCompleted, position } = req.body;
    
    const updates = [];
    const values = [];
    let valueIndex = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${valueIndex++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${valueIndex++}`);
      values.push(description || null);
    }
    if (isCompleted !== undefined) {
      updates.push(`is_completed = $${valueIndex++}`);
      values.push(isCompleted);
    }
    if (position !== undefined) {
      updates.push(`position = $${valueIndex++}`);
      values.push(position);
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(taskId);
    
    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      isCompleted: result.rows[0].is_completed,
      parentId: result.rows[0].parent_id,
      position: result.rows[0].position,
      children: [],
      createdAt: result.rows[0].created_at.toISOString(),
      updatedAt: result.rows[0].updated_at.toISOString()
    };
    
    res.json({ success: true, message: 'Task updated successfully', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete task and all children
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Recursive function to delete task and all its children
    async function deleteTaskAndChildren(id) {
      // Get all children
      const childrenResult = await pool.query('SELECT id FROM tasks WHERE parent_id = $1', [id]);
      
      // Recursively delete children
      for (const child of childrenResult.rows) {
        await deleteTaskAndChildren(child.id);
      }
      
      // Delete the task itself
      await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    }
    
    await deleteTaskAndChildren(taskId);
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
async function startServer() {
  await initDatabase();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();