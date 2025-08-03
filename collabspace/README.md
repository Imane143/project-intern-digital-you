# CollabSpace - Complete Team Collaboration Application

A comprehensive team collaboration web application built for Digital and You company internship project.

## 🚀 Features

### ✅ Complete Feature Set
- **Admin System**: Full admin dashboard for user management
- **Authentication**: Secure login with admin-provided credentials
- **Workspaces**: Create and manage team workspaces
- **Kanban Boards**: Drag-and-drop task management with lists
- **Real-time Chat**: Instant messaging within workspaces
- **Document Management**: File upload, download, and organization
- **Member Management**: Add/remove workspace members
- **Role-based Access**: Admin and employee roles with appropriate permissions

### 🛠 Technology Stack
- **Frontend**: React 18, styled-components, React Router, Socket.io-client
- **Backend**: Node.js, Express.js, Socket.io, SQLite
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: SQLite with comprehensive schema
- **File Storage**: Local filesystem with organized structure
- **Real-time**: Socket.io for chat and live updates

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Quick Start

1. **Clone and setup the project:**
```bash
# Navigate to the project directory
cd collabspace

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Initialize the database and create admin user:**
```bash
# From the backend directory
cd backend
npm run seed
```

This creates an admin user:
- **Email**: `admin@collabspace.com`
- **Password**: `admin123456`

3. **Start the application:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
App runs on: http://localhost:3000

## 🎯 How to Test All Features

### 1. Admin Login & User Creation
1. Open http://localhost:3000
2. Login with admin credentials (admin@collabspace.com / admin123456)
3. Navigate to Admin Dashboard
4. Create new employee accounts:
   - Name: John Doe
   - Email: john@company.com
   - Password: password123
   - Role: Employee

### 2. Employee Login & Workspace Creation
1. Logout and login as the employee (john@company.com / password123)
2. Click "Create Workspace"
3. Fill in workspace details:
   - Name: "Marketing Team"
   - Description: "Marketing collaboration space"
4. Click "Create"

### 3. Kanban Board Testing
1. Click on your workspace
2. Go to "Boards" tab
3. Click "Create Board"
4. Create a board named "Sprint Planning"
5. Click on the board to open it
6. Default lists (To Do, In Progress, Done) are created
7. Add tasks using "+ Add Task" buttons
8. Test drag-and-drop between lists
9. Fill task details including title, description, due date

### 4. Real-time Chat Testing
1. Go to "Chat" tab in the workspace
2. Send messages to test the chat functionality
3. Open another browser/incognito window
4. Login as admin and join the same workspace
5. Send messages from both windows to test real-time communication

### 5. Document Management Testing
1. Go to "Documents" tab
2. Click "Upload File" and select any file
3. Watch the upload progress
4. Test file download by clicking the download button
5. Test file deletion (only your own files or if you're admin)

### 6. Member Management Testing
1. Go to "Members" tab
2. View all workspace members
3. As workspace owner/admin, test removing members
4. Test role-based permissions

## 🏗 Project Architecture

```
collabspace/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # SQLite configuration & schema
│   │   ├── controllers/
│   │   │   ├── authController.js    # Authentication logic
│   │   │   ├── workspaceController.js # Workspace management
│   │   │   ├── boardController.js   # Kanban board logic
│   │   │   ├── chatController.js    # Chat functionality
│   │   │   └── documentController.js # File management
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js              # Auth routes
│   │   │   ├── workspaces.js        # Workspace routes
│   │   │   ├── boards.js            # Board routes
│   │   │   ├── chat.js              # Chat routes
│   │   │   └── documents.js         # Document routes
│   │   ├── scripts/
│   │   │   └── seedAdmin.js         # Admin user creation
│   │   └── server.js                # Express server & Socket.io
│   ├── uploads/                     # File storage directory
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.js            # Shared layout component
    │   │   ├── BoardsView.js        # Kanban board interface
    │   │   ├── ChatView.js          # Real-time chat interface
    │   │   ├── DocumentsView.js     # File management interface
    │   │   ├── MemberManagement.js  # Member management
    │   │   └── ErrorBoundary.js     # Error handling
    │   ├── pages/
    │   │   ├── Login.js             # Authentication page
    │   │   ├── Dashboard.js         # Employee dashboard
    │   │   ├── AdminDashboard.js    # Admin dashboard
    │   │   └── Workspace.js         # Workspace interface
    │   ├── services/
    │   │   ├── api.js               # Axios configuration
    │   │   ├── auth.js              # Authentication service
    │   │   ├── workspace.js         # Workspace API calls
    │   │   ├── board.js             # Board API calls
    │   │   ├── chat.js              # Chat & Socket.io service
    │   │   └── document.js          # Document API calls
    │   ├── App.js                   # Main app component
    │   └── index.js                 # React entry point
    └── package.json
```

## 🗄 Database Schema

The application uses SQLite with the following tables:
- `users` - User accounts (admin/employee)
- `workspaces` - Team workspaces
- `workspace_members` - Workspace membership
- `boards` - Kanban boards
- `lists` - Board columns (To Do, In Progress, Done)
- `tasks` - Individual tasks with drag-and-drop positions
- `messages` - Chat messages
- `documents` - File metadata and storage info

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/users` - Create user (admin only)
- `GET /api/auth/profile` - Get user profile

### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Boards & Tasks
- `GET /api/workspaces/:id/boards` - List workspace boards
- `POST /api/workspaces/:id/boards` - Create board
- `GET /api/workspaces/:id/boards/:boardId` - Get board with tasks
- `POST /api/workspaces/:id/boards/:boardId/tasks` - Create task
- `PUT /api/workspaces/:id/tasks/:taskId` - Update task
- `POST /api/workspaces/:id/tasks/move` - Move task (drag-and-drop)

### Chat
- `GET /api/chat/workspaces/:id/messages` - Get chat history
- Socket events: `join-workspace`, `send-message`, `new-message`

### Documents
- `POST /api/documents/workspaces/:id/upload` - Upload file
- `GET /api/documents/workspaces/:id/files` - List files
- `GET /api/documents/workspaces/:id/files/:fileId/download` - Download file
- `DELETE /api/documents/workspaces/:id/files/:fileId` - Delete file

## ⚡ Performance Features

- **Real-time Updates**: Socket.io for instant chat and notifications
- **Drag-and-Drop**: Smooth task movement with react-beautiful-dnd
- **File Upload Progress**: Real-time upload progress indicators
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: User-friendly loading indicators throughout

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access**: Admin and employee permission levels
- **File Upload Validation**: Size limits and type checking
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Secure cross-origin requests

## 🎥 Demo Instructions

For a comprehensive demo video:

1. **Setup Phase** (2 minutes):
   - Show project structure
   - Start both servers
   - Show admin user creation

2. **Admin Features** (3 minutes):
   - Admin login
   - Create multiple employee accounts
   - Show admin dashboard

3. **Core Collaboration** (5 minutes):
   - Employee login
   - Create workspace
   - Demonstrate all 4 main features:
     - Kanban boards with drag-and-drop
     - Real-time chat
     - Document upload/download
     - Member management

4. **Multi-user Testing** (3 minutes):
   - Multiple browser windows
   - Real-time chat between users
   - Collaborative board editing

Total demo time: ~13 minutes

## 📝 Notes

- **File Storage**: Files are stored locally in `backend/uploads/[workspaceId]/`
- **Database**: SQLite file created as `backend/database.sqlite`
- **Environment**: All configuration in `.env` file
- **Production**: Ready for deployment with minor config changes
- **Scalability**: Can be extended with Redis for Socket.io clustering

---

**Developed for Digital and You Internship Project**  
Complete team collaboration solution with all core features implemented and tested.