import { useEffect, useMemo, useState } from 'react'
import { FileText, Clock, Star, Users, Download } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getPlatformState, refreshPlatformState } from '../../services/platformStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { downloadSimplePdf } from '../../utils/pdfExport'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(() => getPlatformState())

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

  const myProjects = data.projects.filter((p) => p.author === user?.name)
  const myReviewsGiven = data.reviews.filter((r) => r.reviewer === user?.name)
  const assignedCount = Object.values(data.assignments).filter((reviewers) =>
    (reviewers || []).includes(user?.name),
  ).length
  const expectedReviews = assignedCount || myProjects.length * 2
  const myReviewsPending = Math.max(0, expectedReviews - myReviewsGiven.length)

  const averageRating = useMemo(() => {
    const ratings = myProjects.map((p) => p.rating).filter((r) => r != null)
    if (!ratings.length) return 0
    return Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10
  }, [myProjects])

  const collaborationScore = Math.min(100, myReviewsGiven.length * 15 + myProjects.length * 10)

  const stats = [
    { label: 'Projects Uploaded', value: myProjects.length, icon: FileText, bgClass: 'bg-indigo-100 dark:bg-indigo-900/30', iconClass: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Reviews Pending', value: myReviewsPending, icon: Clock, bgClass: 'bg-amber-100 dark:bg-amber-900/30', iconClass: 'text-amber-600 dark:text-amber-400' },
    { label: 'Average Rating', value: averageRating || '-', icon: Star, bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', iconClass: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Collaboration Score', value: `${collaborationScore}%`, icon: Users, bgClass: 'bg-purple-100 dark:bg-purple-900/30', iconClass: 'text-purple-600 dark:text-purple-400' },
  ]

  const chartData = [
    { week: 'W1', reviews: Math.max(0, myReviewsGiven.length - 3) },
    { week: 'W2', reviews: Math.max(0, myReviewsGiven.length - 2) },
    { week: 'W3', reviews: Math.max(0, myReviewsGiven.length - 1) },
    { week: 'W4', reviews: myReviewsGiven.length },
  ]

  const completionPct = expectedReviews ? Math.min(100, Math.round((myReviewsGiven.length / expectedReviews) * 100)) : 0

  const onDownloadReport = () => {
    const projectLines = myProjects.flatMap((p) => {
      const files = p.files || []
      const summary = `- ${p.title} | Status: ${p.status.replace('_', ' ')} | Rating: ${p.rating ?? '-'} | Teacher Score: ${p.finalScore ?? '-'} | Completion: ${p.completionPercentage ?? '-'}% | Files: ${files.length}`
      const fileLines = files.length
        ? files.map((f) => `    * ${f.name} (${Math.max(1, Math.round((f.size || 0) / 1024))} KB)`)
        : ['    * No files attached']
      return [summary, ...fileLines]
    })

    const lines = [
      'Student Peer Review Report',
      `Student: ${user?.name || 'Student'}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Projects Uploaded: ${myProjects.length}`,
      `Reviews Given: ${myReviewsGiven.length}`,
      `Average Rating: ${averageRating || '-'}`,
      '',
      'Project Summary:',
      ...projectLines,
    ]
    downloadSimplePdf({
      filename: `peer-review-report-${Date.now()}.pdf`,
      lines,
    })
  }

  const historyItems = data.activityTimeline
    .filter((item) => item.studentName === user?.name || item.actorName === user?.name)
    .slice(0, 15)

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
      <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your peer review activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Review Completion</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Current assignment</span>
                <span className="font-medium text-slate-800 dark:text-white">{completionPct}%</span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{myReviewsGiven.length} reviews completed</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {data.activityTimeline.slice(0, 4).map((item, i) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{i + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{item.action}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.detail} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Weekly Review Activity</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="reviews" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Download Feedback Report</h3>
            <p className="text-indigo-100 text-sm mt-1">Get a summary of all your peer reviews and teacher feedback</p>
          </div>
          <button
            onClick={onDownloadReport}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
        </div>
      </div>
      </div>
      <aside className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 h-fit xl:sticky xl:top-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">My History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Uploads, reviews, and teacher decisions on your projects</p>
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
