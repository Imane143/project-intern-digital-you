const { db } = require('../config/database');

const getMessages = (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.all(
        `SELECT m.*, u.name as user_name 
         FROM messages m
         INNER JOIN users u ON m.user_id = u.id
         WHERE m.workspace_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [workspaceId, limit, offset],
        (err, messages) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch messages' });
          }
          res.json(messages.reverse());
        }
      );
    }
  );
};

const saveMessage = (workspaceId, userId, content, callback) => {
  db.run(
    'INSERT INTO messages (workspace_id, user_id, content) VALUES (?, ?, ?)',
    [workspaceId, userId, content],
    function(err) {
      if (err) {
        return callback(err);
      }

      db.get(
        `SELECT m.*, u.name as user_name 
         FROM messages m
         INNER JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [this.lastID],
        callback
      );
    }
  );
};

module.exports = {
  getMessages,
  saveMessage
};