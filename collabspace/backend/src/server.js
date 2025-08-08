const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { initializeStorage, cleanupTempFiles } = require('./config/storage');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

// Initialize database and storage
initDatabase();
initializeStorage();

// Clean up old temp files on startup
cleanupTempFiles();

// Schedule periodic cleanup of temp files
setInterval(() => {
  cleanupTempFiles();
}, 6 * 60 * 60 * 1000); // Every 6 hours

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const boardRoutes = require('./routes/boards');
const chatRoutes = require('./routes/chat');
const documentRoutes = require('./routes/documents');

const { saveMessage } = require('./controllers/chatController');
const jwt = require('jsonwebtoken');

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', boardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CollabSpace backend is running' });
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-workspace', (workspaceId) => {
    socket.join(`workspace-${workspaceId}`);
    console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
  });

  socket.on('leave-workspace', (workspaceId) => {
    socket.leave(`workspace-${workspaceId}`);
    console.log(`User ${socket.userId} left workspace ${workspaceId}`);
  });

  socket.on('send-message', ({ workspaceId, content }) => {
    saveMessage(workspaceId, socket.userId, content, (err, message) => {
      if (err) {
        socket.emit('message-error', 'Failed to send message');
        return;
      }
      
      io.to(`workspace-${workspaceId}`).emit('new-message', message);
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});