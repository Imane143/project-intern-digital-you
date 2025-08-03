const express = require('express');
const { body, validationResult } = require('express-validator');
const { login, createUser, getProfile, getAllUsers } = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validateRequest,
  login
);

router.post('/users',
  authMiddleware,
  adminMiddleware,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').optional().isIn(['admin', 'employee']),
  validateRequest,
  createUser
);

router.get('/profile', authMiddleware, getProfile);

router.get('/users', authMiddleware, getAllUsers);

module.exports = router;