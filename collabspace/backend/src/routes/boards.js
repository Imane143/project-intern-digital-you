const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const {
  createBoard,
  getBoards,
  getBoardWithLists,
  createTask,
  updateTask,
  deleteTask,
  moveTask
} = require('../controllers/boardController');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(authMiddleware);

router.get('/workspaces/:workspaceId/boards',
  param('workspaceId').isInt(),
  validateRequest,
  getBoards
);

router.post('/workspaces/:workspaceId/boards',
  param('workspaceId').isInt(),
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  validateRequest,
  createBoard
);

router.get('/workspaces/:workspaceId/boards/:boardId',
  param('workspaceId').isInt(),
  param('boardId').isInt(),
  validateRequest,
  getBoardWithLists
);

router.post('/workspaces/:workspaceId/boards/:boardId/tasks',
  param('workspaceId').isInt(),
  param('boardId').isInt(),
  body('listId').notEmpty(),
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('assignedTo').optional(),
  body('dueDate').optional(),
  validateRequest,
  createTask
);

router.put('/workspaces/:workspaceId/tasks/:taskId',
  param('workspaceId').isInt(),
  param('taskId').isInt(),
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('assignedTo').optional().isInt(),
  body('dueDate').optional().isISO8601(),
  body('listId').optional().isInt(),
  body('position').optional().isInt(),
  validateRequest,
  updateTask
);

router.delete('/workspaces/:workspaceId/tasks/:taskId',
  param('workspaceId').isInt(),
  param('taskId').isInt(),
  validateRequest,
  deleteTask
);

router.post('/workspaces/:workspaceId/tasks/move',
  param('workspaceId').isInt(),
  body('taskId').isInt(),
  body('targetListId').isInt(),
  body('targetPosition').isInt(),
  validateRequest,
  moveTask
);

module.exports = router;