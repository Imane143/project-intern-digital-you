const { db } = require('../config/database');

// Create folders table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  parent_path TEXT DEFAULT '/',
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(workspace_id, path)
)`, (err) => {
  if (err) {
    console.error('Error creating folders table:', err);
  } else {
    console.log('Folders table created successfully');
  }
  
  // Close the database connection
  db.close();
});