import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    const redirect = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
    return <Navigate to={redirect} replace />
  }

  return children
}
