import { useEffect, useState } from 'react'
import { Bell, CheckCircle, Clock, MessageSquare, Upload } from 'lucide-react'
import { getPlatformState, markNotificationRead, refreshPlatformState } from '../../services/platformStore'
import { useAuth } from '../../context/AuthContext'

const iconMap = {
  upload: Upload,
  users: MessageSquare,
  star: CheckCircle,
  clock: Clock,
}

export default function ActivityPage() {
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

  const myTimeline = data.activityTimeline.filter(
    (item) => item.studentName === user?.name || item.actorName === user?.name,
  )

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Activity</h1>
        <p className="text-slate-500 dark:text-slate-400">Your project submissions, peer reviews, and status changes</p>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800 dark:text-white">Notifications</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {data.notifications.map((n) => (
            <div
              key={n.id}
              onClick={async () => {
                await markNotificationRead(n.id)
                setData(getPlatformState())
              }}
              className={`px-6 py-4 flex gap-4 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 dark:text-white font-medium">{n.message}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{n.time}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Activity Timeline</h2>
        </div>
        <div className="p-6">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-600" />
            {myTimeline.map((item) => {
              const Icon = iconMap[item.icon] || Bell
              return (
                <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                  <div className="relative z-10 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 dark:text-white">{item.action}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{item.time}</p>
                  </div>
                </div>
              )
            })}
            {myTimeline.length === 0 && (
              <p className="ml-12 text-sm text-slate-500 dark:text-slate-400">No history yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
