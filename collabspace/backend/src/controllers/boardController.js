const { db } = require('../config/database');

const createBoard = (req, res) => {
  const { workspaceId } = req.params;
  const { name, description } = req.body;
  const createdBy = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, createdBy],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.run(
        'INSERT INTO boards (workspace_id, name, description, created_by) VALUES (?, ?, ?, ?)',
        [workspaceId, name, description, createdBy],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create board' });
          }

          const boardId = this.lastID;

          const defaultLists = ['To Do', 'In Progress', 'Done'];
          let listsCreated = 0;

          defaultLists.forEach((listName, index) => {
            db.run(
              'INSERT INTO lists (board_id, name, position) VALUES (?, ?, ?)',
              [boardId, listName, index],
              (err) => {
                if (!err) {
                  listsCreated++;
                  if (listsCreated === defaultLists.length) {
                    res.status(201).json({
                      id: boardId,
                      workspace_id: workspaceId,
                      name,
                      description,
                      created_by: createdBy
                    });
                  }
                }
              }
            );
          });
        }
      );
    }
  );
};

const getBoards = (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.all(
        'SELECT * FROM boards WHERE workspace_id = ? ORDER BY created_at DESC',
        [workspaceId],
        (err, boards) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch boards' });
          }
          res.json(boards);
        }
      );
    }
  );
};

const getBoardWithLists = (req, res) => {
  const { workspaceId, boardId } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.get(
        'SELECT * FROM boards WHERE id = ? AND workspace_id = ?',
        [boardId, workspaceId],
        (err, board) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch board' });
          }
          if (!board) {
            return res.status(404).json({ error: 'Board not found' });
          }

          db.all(
            'SELECT * FROM lists WHERE board_id = ? ORDER BY position',
            [boardId],
            (err, lists) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to fetch lists' });
              }

              const listIds = lists.map(list => list.id);
              
              if (listIds.length === 0) {
                res.json({ ...board, lists: [] });
                return;
              }

              db.all(
                `SELECT t.*, u.name as assigned_to_name 
                 FROM tasks t
                 LEFT JOIN users u ON t.assigned_to = u.id
                 WHERE t.list_id IN (${listIds.map(() => '?').join(',')})
                 ORDER BY t.position`,
                listIds,
                (err, tasks) => {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to fetch tasks' });
                  }

                  const listsWithTasks = lists.map(list => ({
                    ...list,
                    tasks: tasks.filter(task => task.list_id === list.id)
                  }));

                  res.json({ ...board, lists: listsWithTasks });
                }
              );
            }
          );
        }
      );
    }
  );
};

const createTask = (req, res) => {
  const { workspaceId, boardId } = req.params;
  const { listId, title, description, assignedTo, dueDate } = req.body;
  const createdBy = req.userId;

  console.log('Creating task with data:', {
    workspaceId,
    boardId,
    listId,
    title,
    description,
    assignedTo,
    dueDate,
    createdBy
  });

  // Validate required fields
  if (!listId || !title) {
    console.error('Missing required fields:', { listId, title });
    return res.status(400).json({ error: 'listId and title are required' });
  }

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, createdBy],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.get(
        'SELECT MAX(position) as maxPos FROM tasks WHERE list_id = ?',
        [listId],
        (err, result) => {
          const position = (result?.maxPos || 0) + 1;

          // Process due date
          let processedDueDate = null;
          if (dueDate) {
            try {
              processedDueDate = new Date(dueDate).toISOString();
            } catch (err) {
              console.error('Invalid date format:', dueDate);
              processedDueDate = null;
            }
          }

          db.run(
            `INSERT INTO tasks (list_id, title, description, assigned_to, position, due_date, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [listId, title, description || null, assignedTo || null, position, processedDueDate, createdBy],
            function(err) {
              if (err) {
                console.error('Task creation error:', err);
                return res.status(500).json({ error: 'Failed to create task: ' + err.message });
              }

              res.status(201).json({
                id: this.lastID,
                list_id: listId,
                title,
                description,
                assigned_to: assignedTo,
                position,
                due_date: dueDate,
                created_by: createdBy
              });
            }
          );
        }
      );
    }
  );
};

const updateTask = (req, res) => {
  const { workspaceId, taskId } = req.params;
  const { title, description, assignedTo, dueDate, listId, position } = req.body;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      let query = 'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP';
      const params = [];

      if (title !== undefined) {
        query += ', title = ?';
        params.push(title);
      }
      if (description !== undefined) {
        query += ', description = ?';
        params.push(description);
      }
      if (assignedTo !== undefined) {
        query += ', assigned_to = ?';
        params.push(assignedTo);
      }
      if (dueDate !== undefined) {
        query += ', due_date = ?';
        params.push(dueDate);
      }
      if (listId !== undefined) {
        query += ', list_id = ?';
        params.push(listId);
      }
      if (position !== undefined) {
        query += ', position = ?';
        params.push(position);
      }

      query += ' WHERE id = ?';
      params.push(taskId);

      db.run(query, params, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update task' });
        }
        res.json({ message: 'Task updated successfully' });
      });
    }
  );
};

const deleteTask = (req, res) => {
  const { workspaceId, taskId } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete task' });
        }
        res.json({ message: 'Task deleted successfully' });
      });
    }
  );
};

const moveTask = (req, res) => {
  const { workspaceId } = req.params;
  const { taskId, targetListId, targetPosition } = req.body;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.get(
          'SELECT list_id, position FROM tasks WHERE id = ?',
          [taskId],
          (err, task) => {
            if (err || !task) {
              db.run('ROLLBACK');
              return res.status(404).json({ error: 'Task not found' });
            }

            const sourceListId = task.list_id;
            const sourcePosition = task.position;

            if (sourceListId === targetListId) {
              if (sourcePosition < targetPosition) {
                db.run(
                  'UPDATE tasks SET position = position - 1 WHERE list_id = ? AND position > ? AND position <= ?',
                  [sourceListId, sourcePosition, targetPosition]
                );
              } else if (sourcePosition > targetPosition) {
                db.run(
                  'UPDATE tasks SET position = position + 1 WHERE list_id = ? AND position >= ? AND position < ?',
                  [sourceListId, targetPosition, sourcePosition]
                );
              }
            } else {
              db.run(
                'UPDATE tasks SET position = position - 1 WHERE list_id = ? AND position > ?',
                [sourceListId, sourcePosition]
              );
              db.run(
                'UPDATE tasks SET position = position + 1 WHERE list_id = ? AND position >= ?',
                [targetListId, targetPosition]
              );
            }

            db.run(
              'UPDATE tasks SET list_id = ?, position = ? WHERE id = ?',
              [targetListId, targetPosition, taskId],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to move task' });
                }

                db.run('COMMIT');
                res.json({ message: 'Task moved successfully' });
              }
            );
          }
        );
      });
    }
  );
};

module.exports = {
  createBoard,
  getBoards,
  getBoardWithLists,
  createTask,
  updateTask,
  deleteTask,
  moveTask
};