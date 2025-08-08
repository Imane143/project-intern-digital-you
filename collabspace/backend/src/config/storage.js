const path = require('path');
const fs = require('fs');
const os = require('os');

// Storage configuration
const STORAGE_ROOT = process.env.COLLABSPACE_STORAGE_PATH || path.join(os.homedir(), 'collabspace-storage');

const STORAGE_PATHS = {
  root: STORAGE_ROOT,
  workspaces: path.join(STORAGE_ROOT, 'workspaces'),
  temp: path.join(STORAGE_ROOT, 'temp'),
  avatars: path.join(STORAGE_ROOT, 'avatars')
};

// Ensure storage directories exist
const initializeStorage = () => {
  Object.values(STORAGE_PATHS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created storage directory: ${dir}`);
    }
  });
};

// Get workspace storage path
const getWorkspacePath = (workspaceId) => {
  return path.join(STORAGE_PATHS.workspaces, `workspace-${workspaceId}`);
};

// Get document storage path
const getDocumentPath = (workspaceId, filename) => {
  const workspacePath = getWorkspacePath(workspaceId);
  const documentsPath = path.join(workspacePath, 'documents');
  
  // Ensure directory exists
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
  }
  
  return path.join(documentsPath, filename);
};

// Get avatar storage path
const getAvatarPath = (userId, filename) => {
  const userAvatarPath = path.join(STORAGE_PATHS.avatars, `user-${userId}`);
  
  // Ensure directory exists
  if (!fs.existsSync(userAvatarPath)) {
    fs.mkdirSync(userAvatarPath, { recursive: true });
  }
  
  return path.join(userAvatarPath, filename);
};

// Clean up old temporary files
const cleanupTempFiles = () => {
  const tempDir = STORAGE_PATHS.temp;
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (fs.existsSync(tempDir)) {
    fs.readdirSync(tempDir).forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old temp file: ${file}`);
      }
    });
  }
};

module.exports = {
  STORAGE_PATHS,
  initializeStorage,
  getWorkspacePath,
  getDocumentPath,
  getAvatarPath,
  cleanupTempFiles
};