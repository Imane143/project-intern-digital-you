const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { getMessages } = require('../controllers/chatController');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(authMiddleware);

router.get('/workspaces/:workspaceId/messages',
  param('workspaceId').isInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validateRequest,
  getMessages
);

module.exports = router;