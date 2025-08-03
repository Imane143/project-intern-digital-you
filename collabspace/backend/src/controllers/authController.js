const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createUser = async (req, res) => {
  const { email, password, name, role = 'employee' } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          id: this.lastID,
          email,
          name,
          role
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getProfile = (req, res) => {
  db.get(
    'SELECT id, email, name, role FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
};

const getAllUsers = (req, res) => {
  db.all(
    'SELECT id, email, name, role FROM users ORDER BY name',
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users);
    }
  );
};

module.exports = { login, createUser, getProfile, getAllUsers };