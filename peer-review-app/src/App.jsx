import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/student/StudentDashboard'
import UploadProject from './pages/student/UploadProject'
import PeerReviews from './pages/student/PeerReviews'
import ActivityPage from './pages/student/ActivityPage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import AllProjects from './pages/teacher/AllProjects'
import AssignReviewers from './pages/teacher/AssignReviewers'
import ApprovalsPage from './pages/teacher/ApprovalsPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRole="student">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="upload" element={<UploadProject />} />
              <Route path="reviews" element={<PeerReviews />} />
              <Route path="activity" element={<ActivityPage />} />
            </Route>
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRole="teacher">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="projects" element={<AllProjects />} />
              <Route path="assign" element={<AssignReviewers />} />
              <Route path="approvals" element={<ApprovalsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
