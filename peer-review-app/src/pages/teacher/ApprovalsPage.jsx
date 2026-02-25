import { useEffect, useMemo, useState } from 'react'
import { Check, X, MessageSquare } from 'lucide-react'
import { getPlatformState, refreshPlatformState, saveTeacherDecision } from '../../services/platformStore'
import { useAuth } from '../../context/AuthContext'

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [data, setData] = useState(() => getPlatformState())
  const [selectedProject, setSelectedProject] = useState(null)
  const [teacherComment, setTeacherComment] = useState('')
  const [finalScore, setFinalScore] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState('')
  const [action, setAction] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const latest = await refreshPlatformState()
        if (!active) return
        setData(latest)
        const firstReviewed = latest.projects.find((p) => p.status === 'reviewed')
        setSelectedProject((prev) => latest.projects.find((p) => p.id === prev?.id) || firstReviewed || latest.projects[0] || null)
      } catch {
        const latest = getPlatformState()
        if (!active) return
        setData(latest)
        const firstReviewed = latest.projects.find((p) => p.status === 'reviewed')
        setSelectedProject((prev) => latest.projects.find((p) => p.id === prev?.id) || firstReviewed || latest.projects[0] || null)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const projectReviews = useMemo(
    () => data.reviews.filter((r) => r.projectId === selectedProject?.id),
    [data.reviews, selectedProject],
  )

  useEffect(() => {
    const decision = selectedProject ? data.teacherDecisions[selectedProject.id] : null
    setTeacherComment(decision?.comment || '')
    setAction(decision?.action || null)
    setFinalScore(decision?.finalScore != null ? String(decision.finalScore) : '')
    setCompletionPercentage(
      decision?.completionPercentage != null ? String(decision.completionPercentage) : '',
    )
  }, [selectedProject, data.teacherDecisions])

  const handleSubmit = async () => {
    const score = Number(finalScore)
    const pct = Number(completionPercentage)
    if (!selectedProject || !action || !teacherComment.trim()) return
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setMessage('Final score must be between 0 and 100.')
      return
    }
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setMessage('Completion percentage must be between 0 and 100.')
      return
    }

    const result = await saveTeacherDecision(selectedProject.id, {
      action,
      comment: teacherComment,
      finalScore: score,
      completionPercentage: pct,
      submittedAt: new Date().toISOString(),
      teacherName: user?.name || 'Teacher',
    })
    if (result?.error) {
      setMessage(result.error)
      return
    }

    setData(getPlatformState())
    setMessage('Final decision submitted.')
    setTeacherComment('')
    setAction(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Final Approvals</h1>
        <p className="text-slate-500 dark:text-slate-400">Review peer evaluations and provide final feedback</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white">Projects Ready for Approval</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`px-6 py-4 cursor-pointer transition-colors ${
                    selectedProject?.id === p.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <p className="font-medium text-slate-800 dark:text-white">{p.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">by {p.author} • Avg: {p.rating != null ? `${p.rating}/5` : '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedProject && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800 dark:text-white">Summarized Peer Evaluations</h2>
              </div>
              <div className="p-6 space-y-4">
                {projectReviews.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-slate-800 dark:text-white">{r.reviewer}</span>
                      <span className="text-sm font-medium text-amber-600">{r.rating}/5</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{r.comment}</p>
                  </div>
                ))}
                {projectReviews.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400">No peer reviews yet</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Your Final Decision</h2>
              <textarea
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                placeholder="Add your comments and feedback..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 mb-4 resize-none"
              />
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Final Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={finalScore}
                    onChange={(e) => setFinalScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Completion % (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={completionPercentage}
                    onChange={(e) => setCompletionPercentage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setAction('approve')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                    action === 'approve'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => setAction('improve')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                    action === 'improve'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  Request Improvement
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                    action === 'reject'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                  }`}
                >
                  <X className="w-5 h-5" />
                  Reject
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!action || !teacherComment || finalScore === '' || completionPercentage === ''}
                className="mt-4 w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
              >
                Submit Feedback
              </button>
              {message && <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">{message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
