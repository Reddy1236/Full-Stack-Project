import {
  projects as initialProjects,
  reviews as initialReviews,
  notifications as initialNotifications,
  activityTimeline as initialActivityTimeline,
} from '../data/dummyData'

const STORAGE_KEY = 'peerReview_platformData'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

function baseState() {
  return {
    projects: initialProjects.map((p) => ({
      ...p,
      files: p.files || [],
      finalScore: p.finalScore ?? null,
      completionPercentage: p.completionPercentage ?? null,
    })),
    reviews: [...initialReviews],
    notifications: [...initialNotifications],
    activityTimeline: [...initialActivityTimeline],
    assignments: {},
    teacherDecisions: {},
    reviewReplies: {},
  }
}

function normalizeProject(apiProject) {
  const files = Array.isArray(apiProject.files)
    ? apiProject.files.map((file, index) => {
      if (typeof file === 'string') {
        return { id: `legacy-${index}`, name: file, size: 0 }
      }
      return {
        id: file.id || `${apiProject.id}-file-${index}`,
        name: file.name || 'Untitled file',
        size: Number(file.size || 0),
      }
    })
    : []

  return {
    ...apiProject,
    id: String(apiProject.id),
    status: String(apiProject.status || '').toLowerCase(),
    files,
    finalScore: apiProject.finalScore ?? null,
    completionPercentage: apiProject.completionPercentage ?? null,
  }
}

function normalizeReview(apiReview) {
  return {
    ...apiReview,
    id: String(apiReview.id),
    projectId: String(apiReview.projectId),
  }
}

function normalizePlatformState(payload) {
  const normalized = {
    ...baseState(),
    ...payload,
    projects: (payload.projects || []).map(normalizeProject),
    reviews: (payload.reviews || []).map(normalizeReview),
    assignments: payload.assignments || {},
    teacherDecisions: payload.teacherDecisions || {},
    reviewReplies: payload.reviewReplies || {},
    notifications: payload.notifications || [],
    activityTimeline: (payload.activityTimeline || []).map((item) => ({
      ...item,
      projectId: item.projectId != null ? String(item.projectId) : null,
      projectTitle: item.projectTitle || '',
      studentName: item.studentName || '',
      actorName: item.actorName || '',
      actorRole: item.actorRole || '',
      actionType: item.actionType || '',
    })),
  }

  return ensureUploadHistory(normalized)
}

function ensureUploadHistory(state) {
  const existingUploadByProject = new Set(
    (state.activityTimeline || [])
      .filter((item) => item.actionType === 'project_uploaded' && item.projectId)
      .map((item) => String(item.projectId)),
  )

  const fallbackUploads = (state.projects || [])
    .filter((project) => !existingUploadByProject.has(String(project.id)))
    .map((project) => ({
      id: `synthetic-upload-${project.id}`,
      action: 'Project uploaded',
      detail: `${project.author} uploaded ${project.title} (${(project.files || []).length} files)`,
      time: project.submittedAt || '',
      icon: 'upload',
      projectId: String(project.id),
      projectTitle: project.title,
      studentName: project.author,
      actorName: project.author,
      actorRole: 'student',
      actionType: 'project_uploaded',
    }))

  return {
    ...state,
    activityTimeline: [...fallbackUploads, ...(state.activityTimeline || [])],
  }
}

export function getPlatformState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return baseState()
  try {
    const parsed = JSON.parse(raw)
    return normalizePlatformState(parsed)
  } catch {
    return baseState()
  }
}

export function savePlatformState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export async function refreshPlatformState() {
  const res = await fetch(`${API_BASE_URL}/platform/state`)
  if (!res.ok) {
    throw new Error('Failed to load platform state from backend')
  }
  const payload = await res.json()
  const normalized = normalizePlatformState(payload)
  savePlatformState(normalized)
  return normalized
}

export async function fetchProjects() {
  const state = await refreshPlatformState()
  return state.projects
}

export async function fetchProjectReviews(projectId) {
  const state = await refreshPlatformState()
  return state.reviews.filter((review) => review.projectId === String(projectId))
}

export async function uploadProject({ title, description, author, files }) {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: String(title).trim(),
      description: String(description || '').trim(),
      author: String(author || 'Student').trim(),
      files: (files || []).map((file) => ({
        name: String(file?.name || '').trim(),
        size: Number(file?.size || 0),
      })),
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error || 'Failed to upload project' }
  }

  const project = normalizeProject(await res.json())

  try {
    await refreshPlatformState()
    return project
  } catch {
    return {
      ...project,
      warning: 'Project created, but dashboard refresh failed. Please reload the page.',
    }
  }
}

export async function submitReview({ projectId, reviewer, rating, comment }) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reviewer: String(reviewer).trim(),
      rating: Number(rating),
      comment: String(comment).trim(),
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error || 'Failed to submit review' }
  }

  const review = normalizeReview(await res.json())
  await refreshPlatformState()
  return { review }
}

export async function setAssignment(projectId, reviewers) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/assign-reviewers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewers }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error || 'Failed to save reviewer assignment' }
  }

  await refreshPlatformState()
  return { success: true }
}

export async function saveTeacherDecision(projectId, payload) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error || 'Failed to save teacher decision' }
  }

  await refreshPlatformState()
  return { success: true }
}

export async function addReviewReply(reviewId, text, author) {
  const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: String(text).trim(), author: String(author).trim() }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error || 'Failed to add reply' }
  }

  await refreshPlatformState()
  return { success: true }
}

export async function markNotificationRead(notificationId) {
  const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error || 'Failed to mark notification as read' }
  }

  await refreshPlatformState()
  return { success: true }
}

export function getProjectsForReviewer(reviewerName) {
  const state = getPlatformState()
  const assignments = state.assignments
  const assignedProjectIds = Object.keys(assignments).filter((projectId) =>
    (assignments[projectId] || []).includes(reviewerName),
  )

  if (assignedProjectIds.length) {
    return state.projects.filter((project) => assignedProjectIds.includes(project.id))
  }

  return state.projects.filter((project) => project.author !== reviewerName)
}
