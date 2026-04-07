# Student Peer Review & Collaboration Platform

Full-stack web application developed for the FSAD SDP use case:

`FSAD-SDP-26: Develop a peer review and collaboration platform for students`

## Team

- Team Name: `24SDCS02E-S04-SDP-18`
- Course: `24SDCS02E - FSAD`

## Project Overview

This platform helps students submit projects, participate in peer reviews, and collaborate through a structured academic workflow. It also provides separate dashboards for students, teachers, and admin users.

## Features

- Role-based login and registration
- Student dashboard for project uploads and review tracking
- Teacher dashboard for monitoring, reviewer assignment, and approvals
- Admin dashboard for platform-wide visibility
- Peer review workflow with ratings and comments
- Activity tracking and project status management
- PDF and CSV export support in selected modules
- Frontend and backend deployed online

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Recharts

### Backend

- Spring Boot
- Spring Web
- Spring Data JPA
- MySQL / PostgreSQL support
- Maven

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL

## Live Links

- Frontend: [https://peer-review-app-nine.vercel.app](https://peer-review-app-nine.vercel.app)
- Backend: [https://peer-review-backend-new.onrender.com](https://peer-review-backend-new.onrender.com)
- GitHub Repository: [https://github.com/Reddy1236/Full-Stack-Project](https://github.com/Reddy1236/Full-Stack-Project)

## Project Structure

```text
Full-Stack-Project/
├── peer-review-app/       # Frontend (React + Vite)
├── peer-review-backend/   # Backend (Spring Boot)
└── README.md
```

## Local Setup

### Frontend

```bash
cd peer-review-app
npm install
npm run dev
```

### Backend

```bash
cd peer-review-backend
mvn spring-boot:run
```

## Environment Configuration

### Frontend

Set this in Vercel or local `.env`:

```env
VITE_API_BASE_URL=https://peer-review-backend-new.onrender.com/api
```

### Backend

Typical backend environment variables:

```env
DB_URL=jdbc:postgresql://<host>:5432/<database>
DB_USER=<username>
DB_PASS=<password>
DB_DRIVER=org.postgresql.Driver
DB_DIALECT=org.hibernate.dialect.PostgreSQLDialect
APP_FRONTEND_URL=https://peer-review-app-nine.vercel.app,http://localhost:5173
```

## Main Modules

- Authentication
- Student project submission
- Peer review management
- Teacher approvals and grading
- Admin monitoring and exports

## Notes

- Render free services may sleep after inactivity.
- Render free PostgreSQL databases expire after the free period unless upgraded.
- If deployment URLs change, update environment variables and redeploy.

## Contributors

- Reddy1236

