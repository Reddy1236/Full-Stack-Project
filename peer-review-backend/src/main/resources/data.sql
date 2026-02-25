INSERT INTO users (email, password, name, role, created_at)
SELECT 'student@demo.com', 'student123', 'Demo Student', 'STUDENT', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student@demo.com');

INSERT INTO users (email, password, name, role, created_at)
SELECT 'teacher@demo.com', 'teacher123', 'Demo Teacher', 'TEACHER', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'teacher@demo.com');

INSERT INTO projects (title, author, description, status, submitted_at, rating)
SELECT 'E-commerce Website Redesign', 'Alex Johnson', 'UI/UX redesign project', 'PENDING_REVIEW', CURDATE(), NULL
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'E-commerce Website Redesign');
