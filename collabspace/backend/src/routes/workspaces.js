const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  getMembers,
  removeMember
} = require('../controllers/workspaceController');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(authMiddleware);

router.get('/', getWorkspaces);

router.post('/',
  adminMiddleware,
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  validateRequest,
  createWorkspace
);

router.get('/:id',
  param('id').isInt(),
  validateRequest,
  getWorkspaceById
);

router.put('/:id',
  param('id').isInt(),
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  validateRequest,
  updateWorkspace
);

router.delete('/:id',
  param('id').isInt(),
  validateRequest,
  adminMiddleware,
  deleteWorkspace
);

router.post('/:workspaceId/members',
  param('workspaceId').isInt(),
  body('userId').isInt(),
  body('role').optional().isIn(['member', 'admin']),
  validateRequest,
  addMember
);

router.get('/:workspaceId/members',
  param('workspaceId').isInt(),
  validateRequest,
  getMembers
);

router.delete('/:workspaceId/members/:userId',
  param('workspaceId').isInt(),
  param('userId').isInt(),
  validateRequest,
  removeMember
);

module.exports = router;