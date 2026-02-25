import { useEffect, useMemo, useState } from 'react'
import { Users, FileText, Percent } from 'lucide-react'
import { getPlatformState, refreshPlatformState, saveTeacherDecision } from '../../services/platformStore'
import { useAuth } from '../../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(() => getPlatformState())
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const totalStudents = new Set(data.projects.map((p) => p.author)).size
  const totalProjects = data.projects.length
  const reviewedCount = data.projects.filter((p) => p.status === 'reviewed' || p.status === 'approved').length
  const reviewCompletion = totalProjects ? Math.round((reviewedCount / totalProjects) * 100) : 0

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, bgClass: 'bg-indigo-100 dark:bg-indigo-900/30', iconClass: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Total Projects', value: totalProjects, icon: FileText, bgClass: 'bg-purple-100 dark:bg-purple-900/30', iconClass: 'text-purple-600 dark:text-purple-400' },
    { label: 'Review Completion', value: `${reviewCompletion}%`, icon: Percent, bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', iconClass: 'text-emerald-600 dark:text-emerald-400' },
  ]

  const submissionCounter = {}
  data.projects.forEach((project) => {
    const d = new Date(project.submittedAt)
    const label = monthLabels[d.getMonth()] || 'Unknown'
    submissionCounter[label] = (submissionCounter[label] || 0) + 1
  })
  const submissionTrends = Object.keys(submissionCounter).length
    ? Object.entries(submissionCounter).map(([month, submissions]) => ({ month, submissions }))
    : [
        { month: 'Jan', submissions: 0 },
        { month: 'Feb', submissions: 0 },
        { month: 'Mar', submissions: 0 },
      ]

  const reviewCounter = {}
  data.reviews.forEach((review) => {
    const d = new Date(review.date)
    const label = dayLabels[d.getDay()] || 'Mon'
    reviewCounter[label] = (reviewCounter[label] || 0) + 1
  })
  const collaborationActivity = Object.keys(reviewCounter).length
    ? Object.entries(reviewCounter).map(([day, reviews]) => ({ day, reviews }))
    : [
        { day: 'Mon', reviews: 0 },
        { day: 'Tue', reviews: 0 },
        { day: 'Wed', reviews: 0 },
        { day: 'Thu', reviews: 0 },
        { day: 'Fri', reviews: 0 },
      ]

  const reviewProgressRows = data.projects.map((project) => {
    const projectReviews = data.reviews.filter((r) => r.projectId === project.id)
    const targetReviews = Math.max(2, data.assignments[project.id]?.length || 2)
    const pct = Math.min(100, Math.round((projectReviews.length / targetReviews) * 100))
    return { project, projectReviews, pct }
  })

  const initialDrafts = useMemo(
    () =>
      Object.fromEntries(
        data.projects.map((project) => [
          project.id,
          {
            action: data.teacherDecisions[project.id]?.action || 'approve',
            comment: data.teacherDecisions[project.id]?.comment || '',
            finalScore:
              data.teacherDecisions[project.id]?.finalScore != null
                ? String(data.teacherDecisions[project.id].finalScore)
                : '',
            completionPercentage:
              data.teacherDecisions[project.id]?.completionPercentage != null
                ? String(data.teacherDecisions[project.id].completionPercentage)
                : '',
          },
        ]),
      ),
    [data.projects, data.teacherDecisions],
  )

  const [drafts, setDrafts] = useState(initialDrafts)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const latest = await refreshPlatformState()
        if (active) setData(latest)
      } catch {
        if (active) setData(getPlatformState())
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const setDraftField = (projectId, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), [key]: value },
    }))
  }

  const submitManualDecision = async (projectId) => {
    const draft = drafts[projectId] || {}
    const score = Number(draft.finalScore)
    const pct = Number(draft.completionPercentage)
    if (!draft.comment?.trim()) {
      setSaveMsg('Comment is required before saving project decision.')
      return
    }
    if (Number.isNaN(score) || score < 0 || score > 100 || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setSaveMsg('Score and Completion must be between 0 and 100.')
      return
    }
    const result = await saveTeacherDecision(projectId, {
      action: draft.action || 'approve',
      comment: draft.comment.trim(),
      finalScore: score,
      completionPercentage: pct,
      submittedAt: new Date().toISOString(),
      teacherName: user?.name || 'Teacher',
    })
    if (result?.error) {
      setSaveMsg(result.error)
      return
    }
    setData(getPlatformState())
    setSaveMsg('Project grading + feedback saved.')
  }

  const historyItems = data.activityTimeline
    .filter((item) => item.actionType === 'project_uploaded' || item.actionType === 'teacher_decision')
    .slice(0, 15)

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
      <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of peer review progress and collaboration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, bgClass, iconClass }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
                <Icon className={`w-6 h-6 ${iconClass}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Submission Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Collaboration Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collaborationActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="reviews" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Peer Review Progress Monitoring</h2>
        <div className="space-y-4">
          {reviewProgressRows.map(({ project, pct, projectReviews }) => (
            <div key={project.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 dark:text-slate-300">{project.title}</span>
                <span className="text-slate-500 dark:text-slate-400">{projectReviews.length} reviews • {pct}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Feedback Quality Signals</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 text-sm text-slate-500">Project</th>
                <th className="py-2 text-sm text-slate-500">Avg Rating</th>
                <th className="py-2 text-sm text-slate-500">Teacher Score</th>
                <th className="py-2 text-sm text-slate-500">Comment Depth</th>
                <th className="py-2 text-sm text-slate-500">Quality</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((project) => {
                const projectReviews = data.reviews.filter((r) => r.projectId === project.id)
                const avg = projectReviews.length
                  ? (projectReviews.reduce((sum, r) => sum + Number(r.rating), 0) / projectReviews.length).toFixed(1)
                  : '-'
                const avgWords = projectReviews.length
                  ? Math.round(projectReviews.reduce((sum, r) => sum + String(r.comment || '').split(' ').length, 0) / projectReviews.length)
                  : 0
                const quality = avgWords >= 10 ? 'High' : avgWords >= 6 ? 'Medium' : 'Low'
                return (
                  <tr key={project.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-300">{project.title}</td>
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-300">{avg}</td>
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-300">
                      {project.finalScore != null ? `${project.finalScore}/100` : '-'}
                    </td>
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-300">{avgWords} words</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        quality === 'High' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        quality === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {quality}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Manual Project Review, Grading, and Approval</h2>
        <div className="space-y-4">
          {data.projects.map((project) => {
            const draft = drafts[project.id] || {}
            return (
              <div key={project.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="font-semibold text-slate-800 dark:text-white">{project.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">by {project.author}</p>
                <div className="grid md:grid-cols-4 gap-3 mb-3">
                  <select
                    value={draft.action || 'approve'}
                    onChange={(e) => setDraftField(project.id, 'action', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  >
                    <option value="approve">Approve</option>
                    <option value="improve">Request Improvement</option>
                    <option value="reject">Reject</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Score /100"
                    value={draft.finalScore || ''}
                    onChange={(e) => setDraftField(project.id, 'finalScore', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Completion %"
                    value={draft.completionPercentage || ''}
                    onChange={(e) => setDraftField(project.id, 'completionPercentage', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <button
                    onClick={() => submitManualDecision(project.id)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  >
                    Save Decision
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={draft.comment || ''}
                  onChange={(e) => setDraftField(project.id, 'comment', e.target.value)}
                  placeholder="Write teacher feedback..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
            )
          })}
        </div>
        {saveMsg && <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">{saveMsg}</p>}
      </div>
      </div>
      <aside className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 h-fit xl:sticky xl:top-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Teacher History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Who uploaded and who graded each project</p>
        <div className="mt-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          {historyItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-sm font-medium text-slate-800 dark:text-white">{item.projectTitle || item.action}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.detail}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Student: {item.studentName || '-'} | By: {item.actorName || '-'}
              </p>
              <p className="text-xs text-slate-400 mt-1">{item.time}</p>
            </div>
          ))}
          {historyItems.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No history yet.</p>}
        </div>
      </aside>
    </div>
  )
}
