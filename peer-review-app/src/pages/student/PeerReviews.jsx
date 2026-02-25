import { useEffect, useMemo, useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  addReviewReply,
  fetchProjectReviews,
  fetchProjects,
  getPlatformState,
  submitReview,
} from '../../services/platformStore'

export default function PeerReviews() {
  const { user } = useAuth()
  const [data, setData] = useState(() => getPlatformState())
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [replyInputs, setReplyInputs] = useState({})
  const [structuredFeedback, setStructuredFeedback] = useState({
    clarity: 3,
    creativity: 3,
    completeness: 3,
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    const latest = getPlatformState()
    setData(latest)
  }, [])

  useEffect(() => {
    let active = true
    const loadProjects = async () => {
      try {
        const allProjects = await fetchProjects()
        if (!active) return
        setProjects(allProjects)
      } catch {
        setMessage('Could not load projects from backend.')
      }
    }
    loadProjects()
    return () => {
      active = false
    }
  }, [user?.name])

  const assignedProjects = useMemo(() => {
    const assignments = data.assignments || {}
    const reviewer = user?.name || ''
    const assignedProjectIds = Object.keys(assignments).filter((projectId) =>
      (assignments[projectId] || []).includes(reviewer),
    )
    if (assignedProjectIds.length) {
      return projects.filter((project) => assignedProjectIds.includes(project.id))
    }
    return projects.filter((project) => project.author !== reviewer)
  }, [data.assignments, projects, user?.name])

  useEffect(() => {
    setSelectedProject((prev) => assignedProjects.find((p) => p.id === prev?.id) || assignedProjects[0] || null)
  }, [assignedProjects])

  useEffect(() => {
    let active = true
    const loadReviews = async () => {
      if (!selectedProject?.id) return
      try {
        const projectReviews = await fetchProjectReviews(selectedProject.id)
        if (!active) return
        setData((prev) => ({ ...prev, reviews: projectReviews }))
      } catch {
        setMessage('Could not load reviews from backend.')
      }
    }
    loadReviews()
    return () => {
      active = false
    }
  }, [selectedProject?.id])

  const projectReviews = useMemo(
    () => data.reviews.filter((r) => String(r.projectId) === String(selectedProject?.id)),
    [data.reviews, selectedProject],
  )

  const handleSubmit = async () => {
    if (!selectedProject || !rating || !feedback.trim()) {
      setMessage('Please add rating and feedback before submitting.')
      return
    }

    const result = await submitReview({
      projectId: selectedProject.id,
      reviewer: user?.name || 'Student Reviewer',
      rating,
      comment: feedback,
      structuredFeedback,
    })
    if (result?.error) {
      setMessage(result.error)
      return
    }

    const [allProjects, projectReviews] = await Promise.all([
      fetchProjects(),
      fetchProjectReviews(selectedProject.id),
    ])
    setProjects(allProjects)
    setData((prev) => ({ ...prev, reviews: projectReviews }))
    setRating(0)
    setFeedback('')
    setMessage('Review submitted successfully.')
  }

  const handleReply = async (reviewId) => {
    const text = (replyInputs[reviewId] || '').trim()
    if (!text) return
    const result = await addReviewReply(reviewId, text, user?.name || 'Student')
    if (result?.error) {
      setMessage(result.error)
      return
    }
    setReplyInputs((prev) => ({ ...prev, [reviewId]: '' }))
    setData(getPlatformState())
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Peer Reviews</h1>
        <p className="text-slate-500 dark:text-slate-400">Review your peers' projects and provide feedback</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-white">Assigned to Review</h2>
          {assignedProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedProject?.id === p.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <p className="font-medium text-slate-800 dark:text-white">{p.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">by {p.author}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                p.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' :
                p.status === 'pending_review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {p.status.replace('_', ' ')}
              </span>
            </div>
          ))}
          {assignedProjects.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No projects assigned for review yet.</p>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedProject && (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{selectedProject.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  Provide a rating and constructive feedback for this project.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Overall Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            n <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {message && <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">{message}</p>}
                </div>

                <div className="space-y-4 mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Structured Feedback</label>
                  {['clarity', 'creativity', 'completeness'].map((key) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-slate-600 dark:text-slate-400">{key}</span>
                        <span className="text-slate-800 dark:text-white">{structuredFeedback[key]}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={structuredFeedback[key]}
                        onChange={(e) =>
                          setStructuredFeedback((s) => ({ ...s, [key]: parseInt(e.target.value, 10) }))
                        }
                        className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Written Feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback. What worked well? What could be improved?"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="mt-6 w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                >
                  Submit Review
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Peer Reviews Received
                </h3>
                <div className="space-y-4">
                  {projectReviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-indigo-500"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-white">{r.reviewer}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{r.rating}/5</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{r.comment}</p>
                      <p className="text-xs text-slate-500 mt-2">{r.date}</p>

                      <div className="mt-3 space-y-2">
                        {(data.reviewReplies[r.id] || []).map((reply) => (
                          <div key={reply.id} className="ml-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{reply.author}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{reply.text}</p>
                            <p className="text-xs text-slate-400 mt-1">{reply.date}</p>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            value={replyInputs[r.id] || ''}
                            onChange={(e) => setReplyInputs((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Reply in thread..."
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(r.id)}
                            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {projectReviews.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">No reviews yet</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
