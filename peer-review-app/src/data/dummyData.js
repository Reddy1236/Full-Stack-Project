// Dummy data for demonstration

export const studentStats = {
  projectsUploaded: 3,
  reviewsPending: 2,
  averageRating: 4.2,
  collaborationScore: 87,
}

export const teacherStats = {
  totalStudents: 42,
  totalProjects: 38,
  reviewCompletion: 76,
}

export const projects = [
  { id: '1', title: 'E-commerce Website Redesign', author: 'Alex Johnson', status: 'pending_review', submittedAt: '2025-02-18', rating: null },
  { id: '2', title: 'Mobile App Prototype', author: 'Jamie Lee', status: 'reviewed', submittedAt: '2025-02-15', rating: 4.5 },
  { id: '3', title: 'API Documentation System', author: 'Sam Wilson', status: 'approved', submittedAt: '2025-02-12', rating: 4.8 },
  { id: '4', title: 'Database Schema Design', author: 'Casey Brown', status: 'improvement_requested', submittedAt: '2025-02-14', rating: 3.2 },
]

export const reviews = [
  { id: '1', projectId: '1', reviewer: 'Jordan Smith', rating: 4, comment: 'Great structure and clear UX flow. Consider adding more error states.', date: '2025-02-19' },
  { id: '2', projectId: '1', reviewer: 'Morgan Taylor', rating: 5, comment: 'Excellent work! Very professional design.', date: '2025-02-19' },
]

export const notifications = [
  { id: '1', type: 'review', message: 'Jordan Smith completed a review on your project', time: '2 hours ago', read: false },
  { id: '2', type: 'teacher', message: 'Dr. Chen left feedback on your submission', time: '1 day ago', read: true },
  { id: '3', type: 'deadline', message: 'Peer review deadline: March 1, 2025', time: '2 days ago', read: true },
]

export const activityTimeline = [
  { id: '1', action: 'Project submitted', detail: 'E-commerce Website Redesign', time: 'Feb 18, 2025', icon: 'upload' },
  { id: '2', action: 'Assigned reviewers', detail: '2 peers assigned', time: 'Feb 19, 2025', icon: 'users' },
  { id: '3', action: 'Review received', detail: 'Jordan Smith - 4/5 stars', time: 'Feb 19, 2025', icon: 'star' },
  { id: '4', action: 'Review pending', detail: 'Morgan Taylor - In progress', time: 'Feb 19, 2025', icon: 'clock' },
]

export const submissionTrends = [
  { month: 'Jan', submissions: 12 },
  { month: 'Feb', submissions: 18 },
  { month: 'Mar', submissions: 15 },
  { month: 'Apr', submissions: 22 },
]

export const collaborationActivity = [
  { day: 'Mon', reviews: 8 },
  { day: 'Tue', reviews: 12 },
  { day: 'Wed', reviews: 15 },
  { day: 'Thu', reviews: 10 },
  { day: 'Fri', reviews: 18 },
]
