import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronUp, ChevronDown, Download, X } from 'lucide-react'
import { fetchProjects } from '../../services/platformStore'
import { downloadSimplePdf } from '../../utils/pdfExport'

const statusColors = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  reviewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  improvement_requested: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
}

export default function AllProjects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('submittedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedProject, setSelectedProject] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const rows = await fetchProjects()
        if (!active) return
        setProjects(rows)
      } catch {
        setError('Could not load projects from backend.')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(
    () => projects
      .filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      }),
    [projects, search, sortBy, sortDir],
  )

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else setSortDir('desc')
    setSortBy(col)
  }

  const exportPdf = () => {
    const lines = [
      'Teacher Project Export',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Projects:',
      ...filtered.map((p, index) =>
        `${index + 1}. ${p.title} | Student: ${p.author} | Status: ${p.status.replaceAll('_', ' ')} | Submitted: ${p.submittedAt} | Rating: ${p.rating ?? '-'} | Files: ${(p.files || []).length}`,
      ),
    ]

    downloadSimplePdf({
      filename: `projects-export-${Date.now()}.pdf`,
      lines,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">All Projects</h1>
          <p className="text-slate-500 dark:text-slate-400">View, sort, and search all student submissions</p>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
        <button
          onClick={exportPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or authors..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-4 px-4">
                  <button
                    onClick={() => toggleSort('title')}
                    className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    Project {sortBy === 'title' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
                <th className="text-left py-4 px-4">
                  <button
                    onClick={() => toggleSort('author')}
                    className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    Author {sortBy === 'author' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
                <th className="text-left py-4 px-4">Files</th>
                <th className="text-left py-4 px-4">
                  <button
                    onClick={() => toggleSort('status')}
                    className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    Status {sortBy === 'status' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
                <th className="text-left py-4 px-4">
                  <button
                    onClick={() => toggleSort('submittedAt')}
                    className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    Submitted {sortBy === 'submittedAt' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
                <th className="text-left py-4 px-4 font-medium text-slate-600 dark:text-slate-400">Rating</th>
                <th className="text-left py-4 px-4 font-medium text-slate-600 dark:text-slate-400">Final %</th>
                <th className="text-right py-4 px-4 font-medium text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-4 px-4 font-medium text-slate-800 dark:text-white">{p.title}</td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{p.author}</td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{(p.files || []).length}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{p.submittedAt}</td>
                  <td className="py-4 px-4">{p.rating != null ? `${p.rating}/5` : '-'}</td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                    {p.completionPercentage != null ? `${p.completionPercentage}%` : '-'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setSelectedProject(p)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="p-2 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Author: {selectedProject.author}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Description: {selectedProject.description || 'No description'}</p>
            <h4 className="font-medium text-slate-800 dark:text-white mb-2">Uploaded Files</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(selectedProject.files || []).length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No files attached.</p>
              )}
              {(selectedProject.files || []).map((f) => (
                <div key={f.id} className="p-2 rounded border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
                  {f.name} ({Math.max(1, Math.round((f.size || 0) / 1024))} KB)
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
