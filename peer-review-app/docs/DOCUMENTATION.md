# Student Peer Review & Collaboration Platform - Documentation

## Page Layout Wireframes

### Login Page
```
+------------------------------------------+  +--------------------------------+
|  [Illustration Panel]                    |  |  [Glass-style Login Card]      |
|  - Branding                              |  |  - Role: Student | Teacher     |
|  - Hero text: Collaborate. Review.       |  |  - Email input                 |
|  - Feature list                          |  |  - Password input              |
|  - Illustration placeholder              |  |  - Math addition captcha (e.g. 3 + 5 = ?)              |
|                                          |  |  - Remember me | Forgot pwd    |
|                                          |  |  - [Sign in] button            |
+------------------------------------------+  +--------------------------------+
```

### Dashboard Layout (Student & Teacher)
```
+--------+--------------------------------------------------------+
| Sidebar|  [Search bar] [Theme] [Notifications] [Profile avatar]  |
|        +--------------------------------------------------------+
| Nav    |                                                        |
| - Dash |  [Main Content Area]                                    |
| - Upld |  - Stats cards / Charts / Tables                        |
| - Revi |                                                        |
| - Act  |                                                        |
+--------+--------------------------------------------------------+
```

---

## Component Hierarchy

```
App
├── ThemeProvider
├── AuthProvider
├── BrowserRouter
│   ├── LoginPage
│   └── ProtectedRoute (for /student, /teacher)
│       └── DashboardLayout
│           ├── Sidebar (nav links)
│           ├── Header (search, theme, notifications, profile)
│           └── Outlet
│               ├── StudentDashboard | UploadProject | PeerReviews | ActivityPage
│               └── TeacherDashboard | AllProjects | AssignReviewers | ApprovalsPage
├── ProtectedRoute
└── (various page components)
```

---

## Routing Structure

| Path | Role | Component |
|------|------|-----------|
| `/` | - | Redirect to /login |
| `/login` | - | LoginPage |
| `/student` | Student | DashboardLayout |
| `/student/dashboard` | Student | StudentDashboard |
| `/student/upload` | Student | UploadProject |
| `/student/reviews` | Student | PeerReviews |
| `/student/activity` | Student | ActivityPage |
| `/teacher` | Teacher | DashboardLayout |
| `/teacher/dashboard` | Teacher | TeacherDashboard |
| `/teacher/projects` | Teacher | AllProjects |
| `/teacher/assign` | Teacher | AssignReviewers |
| `/teacher/approvals` | Teacher | ApprovalsPage |
| `*` | - | Redirect to / |

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) NOT NULL, -- 'student' | 'teacher'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50), -- pending_review | reviewed | approved | rejected | improvement_requested
  submitted_at TIMESTAMP DEFAULT NOW(),
  avg_rating DECIMAL(3,2)
);

-- Project Files
CREATE TABLE project_files (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  filename VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER
);

-- Reviewer Assignments
CREATE TABLE reviewer_assignments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  reviewer_id UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(project_id, reviewer_id)
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  reviewer_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  clarity INTEGER,
  creativity INTEGER,
  completeness INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teacher Feedback
CREATE TABLE teacher_feedback (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  teacher_id UUID REFERENCES users(id),
  decision VARCHAR(50), -- approve | reject | improvement_requested
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (for session-based auth)
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(500),
  expires_at TIMESTAMP
);
```

---

## REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (email, password, role) |
| POST | `/api/auth/logout` | Logout / invalidate session |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/forgot-password` | Request password reset |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects (query: role, status, search) |
| POST | `/api/projects` | Create project (multipart: files + metadata) |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/reviews` | Get reviews for project |
| POST | `/api/projects/:id/reviews` | Submit review |
| GET | `/api/reviews/assigned-to-me` | Get projects assigned to review |

### Teacher
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:id/assign-reviewers` | Assign reviewers |
| POST | `/api/projects/:id/feedback` | Submit final approval/rejection |
| GET | `/api/analytics` | Dashboard stats and trends |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |

---

## Folder Structure

```
peer-review-app/
├── public/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── data/
│   │   └── dummyData.js
│   ├── layouts/
│   │   └── DashboardLayout.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── UploadProject.jsx
│   │   │   ├── PeerReviews.jsx
│   │   │   └── ActivityPage.jsx
│   │   └── teacher/
│   │       ├── TeacherDashboard.jsx
│   │       ├── AllProjects.jsx
│   │       ├── AssignReviewers.jsx
│   │       └── ApprovalsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── docs/
│   └── DOCUMENTATION.md
├── index.html
├── package.json
└── vite.config.js
```

---

## Demo Login

- **Student**: Select "Student", email: `student@demo.com`, password: `student123`
- **Teacher**: Select "Teacher", email: `teacher@demo.com`, password: `teacher123`

Authentication is simulated (no backend). Session persists in localStorage when "Remember me" is checked.
