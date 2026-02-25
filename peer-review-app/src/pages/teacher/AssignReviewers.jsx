import { useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { getPlatformState, refreshPlatformState, setAssignment } from '../../services/platformStore'

const students = ['Alex Johnson', 'Jamie Lee', 'Sam Wilson', 'Casey Brown', 'Jordan Smith', 'Morgan Taylor']

export default function AssignReviewers() {
  const [data, setData] = useState(() => getPlatformState())
  const [selectedProject, setSelectedProject] = useState(null)
  const [newReviewer, setNewReviewer] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const latest = await refreshPlatformState()
        if (!active) return
        setData(latest)
        setSelectedProject((prev) => latest.projects.find((p) => p.id === prev?.id) || latest.projects[0] || null)
      } catch {
        const latest = getPlatformState()
        if (!active) return
        setData(latest)
        setSelectedProject((prev) => latest.projects.find((p) => p.id === prev?.id) || latest.projects[0] || null)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const projectReviewers = selectedProject ? data.assignments[selectedProject.id] || [] : []

  const addReviewer = async () => {
    if (!selectedProject || !newReviewer || projectReviewers.includes(newReviewer)) return
    const reviewers = [...projectReviewers, newReviewer]
    await setAssignment(selectedProject.id, reviewers)
    setData(getPlatformState())
    setNewReviewer('')
  }

  const removeReviewer = async (name) => {
    if (!selectedProject) return
    const reviewers = projectReviewers.filter((r) => r !== name)
    await setAssignment(selectedProject.id, reviewers)
    setData(getPlatformState())
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assign Reviewers</h1>
        <p className="text-slate-500 dark:text-slate-400">Assign peer reviewers to student projects</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-white">Select Project</h2>
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
                <p className="text-sm text-slate-500 dark:text-slate-400">by {p.author}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedProject && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white">Assigned Reviewers</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedProject.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <select
                  value={newReviewer}
                  onChange={(e) => setNewReviewer(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select student...</option>
                  {students
                    .filter((s) => s !== selectedProject.author && !projectReviewers.includes(s))
                    .map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <button
                  onClick={addReviewer}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {projectReviewers.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span className="text-slate-800 dark:text-white">{name}</span>
                    </div>
                    <button
                      onClick={() => removeReviewer(name)}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {projectReviewers.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm py-4">No reviewers assigned yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
