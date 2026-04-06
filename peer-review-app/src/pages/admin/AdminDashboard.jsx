import { useEffect, useMemo, useState } from 'react'
import { Activity, BookOpenCheck, Download, FileSpreadsheet, ShieldCheck, Users } from 'lucide-react'
import { getPlatformState, refreshPlatformState } from '../../services/platformStore'
import { downloadSimplePdf } from '../../utils/pdfExport'
import { downloadCsv } from '../../utils/csvExport'

const roleBadgeClass = {
  student: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  teacher: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  admin: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

export default function AdminDashboard() {
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

  const stats = useMemo(() => {
    const users = data.users || []
    const students = users.filter((user) => String(user.role || '').toLowerCase() === 'student').length
    const teachers = users.filter((user) => String(user.role || '').toLowerCase() === 'teacher').length

    return [
      { label: 'Total Users', value: users.length, icon: Users, bgClass: 'bg-indigo-100 dark:bg-indigo-900/30', iconClass: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'Students', value: students, icon: BookOpenCheck, bgClass: 'bg-sky-100 dark:bg-sky-900/30', iconClass: 'text-sky-600 dark:text-sky-400' },
      { label: 'Teachers', value: teachers, icon: ShieldCheck, bgClass: 'bg-amber-100 dark:bg-amber-900/30', iconClass: 'text-amber-600 dark:text-amber-400' },
      { label: 'Activity Events', value: data.activityTimeline.length, icon: Activity, bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', iconClass: 'text-emerald-600 dark:text-emerald-400' },
    ]
  }, [data.activityTimeline.length, data.users])

  const projectRows = useMemo(
    () =>
      data.projects.map((project) => ({
        ...project,
        reviewCount: data.reviews.filter((review) => review.projectId === project.id).length,
        reviewersAssigned: (data.assignments[project.id] || []).length,
      })),
    [data],
  )

  const exportAdminPdf = () => {
    const lines = [
      'Admin Platform Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Total Users: ${data.users.length}`,
      `Students: ${data.users.filter((user) => String(user.role || '').toLowerCase() === 'student').length}`,
      `Teachers: ${data.users.filter((user) => String(user.role || '').toLowerCase() === 'teacher').length}`,
      `Projects: ${data.projects.length}`,
      `Reviews: ${data.reviews.length}`,
      `Activity Events: ${data.activityTimeline.length}`,
      '',
      'Users:',
      ...data.users.map(
        (user, index) =>
          `${index + 1}. ${user.name} | ${user.email} | Role: ${String(user.role || '').toLowerCase()} | Created: ${user.createdAt || '-'}`,
      ),
      '',
      'Projects:',
      ...projectRows.map(
        (project, index) =>
          `${index + 1}. ${project.title} | Student: ${project.author} | Status: ${String(project.status || '').replaceAll('_', ' ')} | Reviews: ${project.reviewCount} | Assigned: ${project.reviewersAssigned} | Teacher Score: ${project.finalScore ?? '-'} | Completion: ${project.completionPercentage ?? '-'}%`,
      ),
      '',
      'Recent Activity:',
      ...data.activityTimeline.slice(0, 30).map(
        (item, index) =>
          `${index + 1}. ${item.action} | ${item.detail} | Project: ${item.projectTitle || '-'} | Student: ${item.studentName || '-'} | By: ${item.actorName || '-'} (${item.actorRole || 'unknown'}) | Time: ${item.time || '-'}`,
      ),
    ]

    downloadSimplePdf({
      filename: `admin-platform-report-${Date.now()}.pdf`,
      lines,
    })
  }

  const exportAdminCsv = () => {
    const rows = projectRows.map((project) => [
      project.title,
      project.author,
      String(project.status || '').replaceAll('_', ' '),
      project.reviewCount,
      project.reviewersAssigned,
      project.finalScore ?? '',
      project.completionPercentage ?? '',
      (project.files || []).length,
    ])

    downloadCsv({
      filename: `admin-project-overview-${Date.now()}.csv`,
      headers: ['Project', 'Student', 'Status', 'Reviews', 'Assigned', 'Teacher Score', 'Completion %', 'Files'],
      rows,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Full visibility into users, teacher actions, student submissions, and platform activity.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={exportAdminCsv}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={exportAdminPdf}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, bgClass, iconClass }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
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

      <div className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6">
        <section id="users" className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white">All Users</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Admin can see every registered student, teacher, and admin account.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-6 text-sm text-slate-500">Name</th>
                  <th className="text-left py-3 px-6 text-sm text-slate-500">Email</th>
                  <th className="text-left py-3 px-6 text-sm text-slate-500">Role</th>
                  <th className="text-left py-3 px-6 text-sm text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => {
                  const normalizedRole = String(user.role || '').toLowerCase()
                  return (
                    <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                      <td className="py-3 px-6 text-sm font-medium text-slate-800 dark:text-white">{user.name}</td>
                      <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-300">{user.email}</td>
                      <td className="py-3 px-6 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadgeClass[normalizedRole] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                          {normalizedRole}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400">{user.createdAt || '-'}</td>
                    </tr>
                  )
                })}
                {data.users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-6 px-6 text-sm text-slate-500 dark:text-slate-400">No users available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white">Recent Activity</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Teacher and student actions across the platform.</p>
          </div>
          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
            {data.activityTimeline.slice(0, 14).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.action}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.detail}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Project: {item.projectTitle || '-'} | Student: {item.studentName || '-'} | By: {item.actorName || '-'} ({item.actorRole || 'unknown'})
                </p>
                <p className="text-xs text-slate-400 mt-1">{item.time}</p>
              </div>
            ))}
            {data.activityTimeline.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Project and Review Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Admin can track every student submission, review count, assignments, and teacher grading.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-6 text-sm text-slate-500">Project</th>
                <th className="text-left py-3 px-6 text-sm text-slate-500">Student</th>
                <th className="text-left py-3 px-6 text-sm text-slate-500">Status</th>
                <th className="text-left py-3 px-6 text-sm text-slate-500">Reviews</th>
                <th className="text-left py-3 px-6 text-sm text-slate-500">Assigned</th>
                <th className="text-left py-3 px-6 text-sm text-slate-500">Teacher Score</th>
                <th className="text-left py-3 px-6 text-sm text-slate-500">Completion</th>
              </tr>
            </thead>
            <tbody>
              {projectRows.map((project) => (
                <tr key={project.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <td className="py-3 px-6 text-sm font-medium text-slate-800 dark:text-white">{project.title}</td>
                  <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-300">{project.author}</td>
                  <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-300">{String(project.status || '').replaceAll('_', ' ')}</td>
                  <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-300">{project.reviewCount}</td>
                  <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-300">{project.reviewersAssigned}</td>
                  <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-300">
                    {project.finalScore != null ? `${project.finalScore}/100` : '-'}
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-300">
                    {project.completionPercentage != null ? `${project.completionPercentage}%` : '-'}
                  </td>
                </tr>
              ))}
              {projectRows.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-6 px-6 text-sm text-slate-500 dark:text-slate-400">No projects available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
