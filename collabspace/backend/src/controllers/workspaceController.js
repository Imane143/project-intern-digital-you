const { db } = require('../config/database');

const createWorkspace = (req, res) => {
  const { name, description } = req.body;
  const createdBy = req.userId;

  console.log('Creating workspace:', { name, description, createdBy });

  db.run(
    'INSERT INTO workspaces (name, description, created_by) VALUES (?, ?, ?)',
    [name, description || null, createdBy],
    function(err) {
      if (err) {
        console.error('Error creating workspace:', err);
        return res.status(500).json({ error: 'Failed to create workspace: ' + err.message });
      }

      const workspaceId = this.lastID;
      console.log('Workspace created with ID:', workspaceId);

      db.run(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
        [workspaceId, createdBy, 'owner'],
        (err) => {
          if (err) {
            console.error('Error adding workspace member:', err);
            return res.status(500).json({ error: 'Failed to add creator as member: ' + err.message });
          }

          console.log('Workspace member added successfully');
          res.status(201).json({
            id: workspaceId,
            name,
            description,
            created_by: createdBy
          });
        }
      );
    }
  );
};

const getWorkspaces = (req, res) => {
  const userId = req.userId;

  db.all(
    `SELECT w.*, wm.role as user_role
     FROM workspaces w
     INNER JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId],
    (err, workspaces) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch workspaces' });
      }
      res.json(workspaces);
    }
  );
};

const getWorkspaceById = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  db.get(
    `SELECT w.*, wm.role as user_role
     FROM workspaces w
     INNER JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE w.id = ? AND wm.user_id = ?`,
    [id, userId],
    (err, workspace) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch workspace' });
      }
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found or access denied' });
      }
      res.json(workspace);
    }
  );
};

const updateWorkspace = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.userId;

  db.get(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [id, userId],
    (err, member) => {
      if (err || !member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      db.run(
        'UPDATE workspaces SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update workspace' });
          }
          res.json({ id, name, description });
        }
      );
    }
  );
};

const deleteWorkspace = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [id, userId],
    (err, member) => {
      if (err || !member || member.role !== 'owner') {
        return res.status(403).json({ error: 'Only workspace owner can delete' });
      }

      db.run('DELETE FROM workspaces WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete workspace' });
        }
        res.json({ message: 'Workspace deleted successfully' });
      });
    }
  );
};

const addMember = (req, res) => {
  const { workspaceId } = req.params;
  const { userId, role = 'member' } = req.body;
  const requesterId = req.userId;

  db.get(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, requesterId],
    (err, member) => {
      if (err || !member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      db.run(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
        [workspaceId, userId, role],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'User is already a member' });
            }
            return res.status(500).json({ error: 'Failed to add member' });
          }
          res.status(201).json({ message: 'Member added successfully' });
        }
      );
    }
  );
};

const getMembers = (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Access denied' });
      }

      db.all(
        `SELECT u.id, u.email, u.name, wm.role, wm.joined_at
         FROM workspace_members wm
         INNER JOIN users u ON wm.user_id = u.id
         WHERE wm.workspace_id = ?
         ORDER BY wm.joined_at`,
        [workspaceId],
        (err, members) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch members' });
          }
          res.json(members);
        }
      );
    }
  );
};

const removeMember = (req, res) => {
  const { workspaceId, userId } = req.params;
  const requesterId = req.userId;
  const requesterRole = req.userRole; // System role from JWT

  // Check if the user to be removed is a system admin
  db.get(
    'SELECT role FROM users WHERE id = ?',
    [userId],
    (err, targetUser) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check user role' });
      }

      // System admins cannot be removed by anyone except other system admins
      if (targetUser && targetUser.role === 'admin' && requesterRole !== 'admin') {
        return res.status(403).json({ error: 'System administrators cannot be removed from workspaces' });
      }

      // Check workspace permissions
      db.get(
        'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
        [workspaceId, requesterId],
        (err, member) => {
          if (err || !member) {
            return res.status(403).json({ error: 'Access denied' });
          }

          // Only system admins or workspace owners/admins can remove members
          if (requesterRole !== 'admin' && member.role !== 'owner' && member.role !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
          }

          // Workspace owners cannot remove themselves
          if (userId === requesterId && member.role === 'owner') {
            return res.status(400).json({ error: 'Owner cannot remove themselves' });
          }

          // System admins cannot remove themselves unless they're the requester
          if (targetUser && targetUser.role === 'admin' && userId === requesterId) {
            return res.status(400).json({ error: 'System administrators cannot remove themselves from workspaces' });
          }

          db.run(
            'DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to remove member' });
              }
              res.json({ message: 'Member removed successfully' });
            }
          );
        }
      );
    }
  );
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  getMembers,
  removeMember
};