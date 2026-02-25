import { useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { uploadProject } from '../../services/platformStore'

export default function UploadProject() {
  const { user } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const newFiles = [...e.dataTransfer.files]
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleFileInput = (e) => {
    const newFiles = [...e.target.files]
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || files.length === 0) {
      setMessage('Please add title, description, and at least one file.')
      return
    }

    const result = await uploadProject({
      title,
      description,
      author: user?.name || 'Student',
      files,
    })
    if (result?.error) {
      setMessage(result.error)
      return
    }

    setTitle('')
    setDescription('')
    setFiles([])
    setMessage(result?.warning || 'Project submitted successfully and added to dashboard.')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Upload Project</h1>
        <p className="text-slate-500 dark:text-slate-400">Submit your project for peer review</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. E-commerce Website Redesign"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project, technologies used, and key features..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Drag & Drop */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Project Files</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">PDF, DOC, ZIP up to 10MB</p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer font-medium"
            >
              Choose Files
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-medium text-slate-800 dark:text-white">{file.name}</span>
                    <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="p-1 text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
        >
          Submit Project
        </button>
        {message && (
          <p className="text-sm text-indigo-600 dark:text-indigo-400">{message}</p>
        )}
      </form>
    </div>
  )
}
