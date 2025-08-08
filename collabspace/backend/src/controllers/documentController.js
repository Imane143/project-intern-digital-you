const { db } = require('../config/database');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getDocumentPath, initializeStorage } = require('../config/storage');

// Initialize storage on module load
initializeStorage();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files are stored in memory first, we'll save them manually
    cb(null, null);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Use memory storage for better control
const memoryStorage = multer.memoryStorage();

const upload = multer({ 
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const uploadFile = (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.userId;
  const folderPath = req.body.folderPath || '/';

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + '-' + req.file.originalname;
      const filePath = getDocumentPath(workspaceId, filename);

      // Save file to new storage location
      try {
        fs.writeFileSync(filePath, req.file.buffer);
      } catch (error) {
        console.error('Failed to save file:', error);
        return res.status(500).json({ error: 'Failed to save file' });
      }

      const fileData = {
        workspace_id: workspaceId,
        name: filename,
        original_name: req.file.originalname,
        file_path: filePath,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        uploaded_by: userId,
        folder_path: folderPath
      };

      db.run(
        `INSERT INTO documents (workspace_id, name, original_name, file_path, file_size, mime_type, uploaded_by, folder_path) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(fileData),
        function(err) {
          if (err) {
            // Clean up file if database insert fails
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            return res.status(500).json({ error: 'Failed to save document info' });
          }

          res.status(201).json({
            id: this.lastID,
            ...fileData,
            url: `/api/documents/workspaces/${workspaceId}/files/${this.lastID}/download`
          });
        }
      );
    }
  );
};

const getDocuments = (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.userId;
  const folderPath = req.query.folderPath || '/';

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.all(
        `SELECT d.*, u.name as uploaded_by_name
         FROM documents d
         INNER JOIN users u ON d.uploaded_by = u.id
         WHERE d.workspace_id = ? AND d.folder_path = ?
         ORDER BY d.created_at DESC`,
        [workspaceId, folderPath],
        (err, documents) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch documents' });
          }

          const documentsWithUrls = documents.map(doc => ({
            ...doc,
            url: `/api/documents/workspaces/${workspaceId}/files/${doc.id}/download`
          }));

          res.json(documentsWithUrls);
        }
      );
    }
  );
};

const downloadFile = (req, res) => {
  const { workspaceId, fileId } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.get(
        'SELECT * FROM documents WHERE id = ? AND workspace_id = ?',
        [fileId, workspaceId],
        (err, document) => {
          if (err) {
            console.error('Database error fetching document:', err);
            return res.status(500).json({ error: 'Failed to fetch document' });
          }
          if (!document) {
            console.error('Document not found:', fileId, workspaceId);
            return res.status(404).json({ error: 'Document not found' });
          }

          console.log('Trying to download file:', document.file_path);
          if (!fs.existsSync(document.file_path)) {
            console.error('File not found on filesystem:', document.file_path);
            return res.status(404).json({ error: 'File not found on server' });
          }

          res.download(document.file_path, document.original_name, (err) => {
            if (err) {
              console.error('Download error:', err);
              if (!res.headersSent) {
                res.status(500).json({ error: 'Download failed' });
              }
            }
          });
        }
      );
    }
  );
};

const deleteFile = (req, res) => {
  const { workspaceId, fileId } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      db.get(
        'SELECT * FROM documents WHERE id = ? AND workspace_id = ?',
        [fileId, workspaceId],
        (err, document) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch document' });
          }
          if (!document) {
            return res.status(404).json({ error: 'Document not found' });
          }

          if (document.uploaded_by !== userId && member.role === 'member') {
            return res.status(403).json({ error: 'Insufficient permissions' });
          }

          db.run(
            'DELETE FROM documents WHERE id = ?',
            [fileId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to delete document' });
              }

              if (fs.existsSync(document.file_path)) {
                fs.unlinkSync(document.file_path);
              }

              res.json({ message: 'Document deleted successfully' });
            }
          );
        }
      );
    }
  );
};

const getFolders = (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.userId;

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      // Get folders from both the folders table and documents table
      db.all(
        `SELECT path FROM folders WHERE workspace_id = ?
         UNION
         SELECT DISTINCT folder_path as path FROM documents WHERE workspace_id = ?
         ORDER BY path`,
        [workspaceId, workspaceId],
        (err, folders) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch folders' });
          }

          const folderStructure = buildFolderTree(folders.map(f => f.path));
          res.json(folderStructure);
        }
      );
    }
  );
};

const buildFolderTree = (paths) => {
  const tree = { name: '/', path: '/', children: [] };
  
  paths.forEach(path => {
    if (path === '/') return;
    
    const parts = path.split('/').filter(p => p);
    let current = tree;
    let currentPath = '';
    
    parts.forEach(part => {
      currentPath += '/' + part;
      let folder = current.children.find(f => f.name === part);
      
      if (!folder) {
        folder = { name: part, path: currentPath, children: [] };
        current.children.push(folder);
      }
      
      current = folder;
    });
  });
  
  return tree;
};

const createFolder = (req, res) => {
  const { workspaceId } = req.params;
  const { name, parentPath = '/' } = req.body;
  const userId = req.userId;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  db.get(
    'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      const folderPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;

      db.run(
        'INSERT INTO folders (workspace_id, name, path, parent_path, created_by) VALUES (?, ?, ?, ?, ?)',
        [workspaceId, name, folderPath, parentPath, userId],
        function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
              return res.status(400).json({ error: 'Folder already exists' });
            }
            return res.status(500).json({ error: 'Failed to create folder' });
          }

          res.status(201).json({
            id: this.lastID,
            name,
            path: folderPath,
            parent_path: parentPath
          });
        }
      );
    }
  );
};

module.exports = {
  upload,
  uploadFile,
  getDocuments,
  downloadFile,
  deleteFile,
  getFolders,
  createFolder
};