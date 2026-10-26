# Student Portfolio — AWDF Practicals

**Student:** Patel Aneri  
**Course:** Advanced Web Development Framework (AWDF)  
**Repository:** https://github.com/Aneri-1203/Student_Portfolio

A React portfolio website integrated with a full-stack Task Management
application. Built incrementally across AWDF practicals.

---

## Project Structure

```
student-portfolio/
├── src/                    # React frontend source
│   ├── components/         # Reusable UI components
│   │   ├── NavBar.jsx
│   │   ├── PageLoader.jsx  # Lazy-load fallback (Practical 8)
│   │   ├── header.jsx
│   │   ├── about.jsx
│   │   ├── skills.jsx      # React.memo optimised (Practical 8)
│   │   ├── footer.jsx      # React.memo optimised (Practical 8)
│   │   ├── spinner.jsx
│   │   └── errormessage.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Projects.jsx    # Lazy-loaded (Practical 8)
│   │   ├── Contact.jsx     # Lazy-loaded (Practical 8)
│   │   ├── Tasks.jsx       # Lazy-loaded (Practical 8)
│   │   └── NotFound.jsx    # Lazy-loaded (Practical 8)
│   ├── context/
│   │   └── AuthContext.jsx # JWT auth state management
│   ├── api.js              # All backend API calls (with JWT headers)
│   ├── App.jsx             # Routes + lazy loading + theme toggle
│   └── main.jsx            # React entry point
├── backend/                # Node.js / Express API
│   ├── server.js           # Express server, all routes
│   ├── models/
│   │   ├── User.js         # Mongoose user schema
│   │   └── tasks.js        # Mongoose task schema
│   ├── middleware/
│   │   ├── auth.js         # JWT verification middleware
│   │   └── validateTask.js # Request validation middleware
│   └── package.json
├── docs/
│   └── practical-8/
│       ├── performance-report.md
│       └── screenshots/
├── public/
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

---

## Features

### Portfolio
- Home page with name, about section, and skills list
- Projects page showcasing GitHub repositories
- Contact form (opens Gmail compose)
- Dark / Light theme toggle
- Responsive design

### Task Management (Full-Stack)
- Create, read, update, delete tasks
- Task fields: title, description, status, priority, due date
- Tasks stored in MongoDB via Express REST API
- All mutations require authentication (JWT)

### Authentication
- User registration with bcrypt password hashing
- JWT login with 1-hour token expiry
- Token stored in localStorage, sent as Bearer header
- Protected task routes reject unauthenticated requests
- Google OAuth login support
- Forgot / reset password flow

### Performance (Practical 8)
- Route-level code splitting with `React.lazy()` and `Suspense`
- Projects, Contact, Tasks, NotFound loaded only when visited
- Accessible `PageLoader` fallback matching portfolio design
- `React.memo` on `Footer` (zero props) and `Skills` (stable list)

---

## Prerequisites

- Node.js v18 or later (tested on v24.13.1)
- npm v8 or later
- MongoDB (local or Atlas)
- A `.env` file in the `backend/` folder (see below)

---

## Installation

### Frontend

```bash
# From the repository root
npm install
```

### Backend

```bash
cd backend
npm install
```

---

## Environment Variables

Create `backend/.env` with the following keys. **Never commit real secrets.**

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/portfolio
JWT_SECRET=your_jwt_secret_here_at_least_32_chars
PORT=5000
GOOGLE_CLIENT_ID=your_google_oauth_client_id   # optional
EMAIL_USER=your_gmail_address                  # optional, for password reset
EMAIL_PASSWORD=your_gmail_app_password         # optional
FRONTEND_URL=http://localhost:5173
```

A safe template is provided at `backend/.env.example`.

---

## Running the Application

Open two terminals.

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**

```bash
npm run dev
# App starts on http://localhost:5173
```

---

## API Endpoints

| Method | Path                    | Auth required | Description              |
|--------|-------------------------|---------------|--------------------------|
| POST   | /register               | No            | Create user account      |
| POST   | /login                  | No            | Login, returns JWT       |
| GET    | /me                     | Yes           | Get current user         |
| POST   | /auth/google            | No            | Google OAuth login       |
| POST   | /auth/forgot-password   | No            | Send password reset link |
| POST   | /auth/reset-password    | No            | Reset password via token |
| GET    | /tasks                  | No            | List all tasks           |
| POST   | /tasks                  | Yes           | Create task              |
| PUT    | /tasks/:id              | Yes (owner)   | Update task              |
| DELETE | /tasks/:id              | Yes (owner)   | Delete task              |

---

## Testing Authentication and Tasks

1. Start both backend and frontend.
2. Navigate to `http://localhost:5173/tasks`.
3. Click **Add Task** — you will need to be authenticated.
4. Register a new account or log in.
5. Create a task with a title — should succeed.
6. Try creating a task with no title — the frontend and backend both reject it.
7. Edit or delete a task created by your account — should succeed.
8. Try editing another user's task — the backend returns 403 Forbidden.

---

## Practical 8 — Performance Measurements

### Build command
```bash
npm run build
```

### Before optimization (baseline)
| Asset          | Raw size  | Gzip     |
|----------------|-----------|----------|
| `index-*.js`   | 247.22 kB | 78.62 kB |
| `index-*.css`  | 16.12 kB  | 3.44 kB  |

Single monolithic JS bundle. All page code downloaded on first load.

### After optimization
| Asset             | Raw size  | Gzip     |
|-------------------|-----------|----------|
| `index-*.js`      | 238.22 kB | 76.36 kB |
| `index-*.css`     | 12.31 kB  | 2.96 kB  |
| `Tasks-*.css`     | 4.25 kB   | 1.17 kB  |
| `NotFound-*.js`   | 0.40 kB   | 0.27 kB  |
| `Contact-*.js`    | 1.61 kB   | 0.76 kB  |
| `Projects-*.js`   | 2.64 kB   | 0.97 kB  |
| `Tasks-*.js`      | 5.54 kB   | 1.78 kB  |

Initial JS reduced by ~9 kB raw / ~2.26 kB gzip. Route chunks load on demand.

Full report: `docs/practical-8/performance-report.md`

---

## Practicals Completed

| Practical | Topic                                         | Status      |
|-----------|-----------------------------------------------|-------------|
| 1         | React basics, component structure             | Complete    |
| 2         | Routing, NavBar, pages                        | Complete    |
| 3         | Portfolio design, theme toggle, CSS variables | Complete    |
| 4–6       | Backend setup, MongoDB, Express REST API      | Complete    |
| 7         | Authentication (bcrypt, JWT, middleware)      | Complete    |
| 8         | Lazy loading, code splitting, React.memo      | Complete    |
