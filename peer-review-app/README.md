# Student Peer Review & Collaboration Platform

A modern SaaS-style web application for student peer review and collaboration, built with React and Vite.

## Features

### Students
- Dashboard with stats (projects uploaded, reviews pending, average rating, collaboration score)
- Upload projects with drag-and-drop file upload
- Peer review interface with rating system and structured feedback
- Activity timeline and notifications
- Download feedback report

### Teachers
- Analytics dashboard (total students, projects, review completion %)
- Submission trends and collaboration activity charts
- Sortable, searchable projects table
- Assign peer reviewers to projects
- Final approval, rejection, or improvement request with comments

### Design
- Split-screen login with illustration panel and glass-style card
- Role selection (Student/Teacher)
- Captcha verification (demo: enter `PEER`)
- Dark/light theme toggle
- Responsive layout

## Quick Start

```bash
cd peer-review-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Demo Login (default accounts only – no database)
| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Student | student@demo.com   | student123  |
| Teacher | teacher@demo.com   | teacher123  |

Solve the addition captcha, then sign in.
- Click Sign in

## Tech Stack
- React 19 + Vite 7
- React Router v7
- Tailwind CSS v4
- Recharts (charts)
- Lucide React (icons)

## Project Structure
See `docs/DOCUMENTATION.md` for wireframes, component hierarchy, routing, database schema, and API endpoints.
