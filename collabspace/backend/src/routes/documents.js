const express = require('express');
const { param, query, body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const {
  upload,
  uploadFile,
  getDocuments,
  downloadFile,
  deleteFile,
  getFolders,
  createFolder
} = require('../controllers/documentController');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(authMiddleware);

router.post('/workspaces/:workspaceId/upload',
  param('workspaceId').isInt(),
  validateRequest,
  upload.single('file'),
  uploadFile
);

router.get('/workspaces/:workspaceId/files',
  param('workspaceId').isInt(),
  query('folderPath').optional(),
  validateRequest,
  getDocuments
);

router.get('/workspaces/:workspaceId/files/:fileId/download',
  param('workspaceId').isInt(),
  param('fileId').isInt(),
  validateRequest,
  downloadFile
);

router.delete('/workspaces/:workspaceId/files/:fileId',
  param('workspaceId').isInt(),
  param('fileId').isInt(),
  validateRequest,
  deleteFile
);

router.get('/workspaces/:workspaceId/folders',
  param('workspaceId').isInt(),
  validateRequest,
  getFolders
);

router.post('/workspaces/:workspaceId/folders',
  param('workspaceId').isInt(),
  body('name').notEmpty().trim(),
  body('parentPath').optional(),
  validateRequest,
  createFolder
);

module.exports = router;