# Peer Review Backend (Spring Boot + MySQL/PostgreSQL)

## 1) Create DB from MySQL Workbench
Open MySQL Workbench and run:

`database/mysql-workbench-setup.sql`

## 2) Configure credentials
Edit:

`src/main/resources/application.properties`

Update one of these options:
- Use root account: set `spring.datasource.username=root` and your password.
- Use dedicated account: set `spring.datasource.username=peerreview_user` and `spring.datasource.password=peerreview_pass`.

## 3) Run backend
Prerequisite: Maven installed locally.

```bash
cd /Users/avinashreddypadala/Desktop/Peer\ Review/peer-review-backend
mvn spring-boot:run
```

Backend runs on: `http://localhost:8080`

## Render deployment

Use the backend folder as the Docker root:

- Root directory: `peer-review-backend`
- Dockerfile path: `Dockerfile`

Set these environment variables in Render:

```env
DATABASE_URL=<your Render Postgres Internal Database URL>
APP_FRONTEND_URL=https://peer-review-app-nine.vercel.app,http://localhost:5173
```

`DATABASE_URL` may be either Render's normal `postgres://...` URL or a JDBC URL like `jdbc:postgresql://...`. The app converts Render's URL format automatically.

## 4) API quick test
- GET `http://localhost:8080/api/projects`
- POST `http://localhost:8080/api/auth/register`
- POST `http://localhost:8080/api/auth/login`
- GET `http://localhost:8080/api/projects/1/reviews`
- POST `http://localhost:8080/api/projects/1/reviews`

## 5) Connect from frontend
Your Vite app can call the backend at `http://localhost:8080/api`.
CORS for `http://localhost:5173` is already enabled.
