import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, Mail, Lock, Shield } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaInput, setCaptchaInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRegisterPopup, setShowRegisterPopup] = useState(false)
  const canvasRef = useRef(null)

  const generateCaptcha = useCallback(() => {
    const a = Math.floor(Math.random() * 9) + 1
    const b = Math.floor(Math.random() * 9) + 1
    return { a, b, sum: a + b }
  }, [])
  const [captcha, setCaptcha] = useState(() => generateCaptcha())

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setCaptchaInput('')
    setError('')
  }

  const handleRoleChange = (nextRole) => {
    setRole(nextRole)
    setCaptcha(generateCaptcha())
    setCaptchaInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email || !password) {
      setError('Please enter email and password')
      refreshCaptcha()
      return
    }
    const answer = parseInt(captchaInput, 10)
    if (isNaN(answer) || answer !== captcha.sum) {
      setError('Incorrect answer. Please try again.')
      refreshCaptcha()
      return
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name')
        refreshCaptcha()
        return
      }

      const reg = await register({ email, password, name, role })
      if (reg.success) {
        setMode('login')
        const successMessage = reg.message || 'Successfully registered. Please login with the same credentials.'
        setSuccess(successMessage)
        setShowRegisterPopup(true)
        setName('')
      } else {
        setError(reg.error || 'Registration failed')
        refreshCaptcha()
      }
    } else {
      const res = await login(email, password, role, rememberMe)
      if (res.success) {
        const targetRole = res.role || role
        setTimeout(() => {
          navigate(targetRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', { replace: true })
        }, 0)
      } else {
        setError(res.error || 'Login failed')
        refreshCaptcha()
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let particles = []
    let rafId = 0
    const dpr = window.devicePixelRatio || 1
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (prefersReduced) return

    const initParticles = () => {
      const count = Math.min(90, Math.floor((w * h) / 20000))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.35 + 0.15,
      }))
    }

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initParticles()
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(140, 180, 255, 0.35)'

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      rafId = window.requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="login-bg" aria-hidden="true">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
      </div>
      <canvas ref={canvasRef} className="login-particles" aria-hidden="true" />

      <div className="relative z-10 min-h-screen flex">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900/80 via-indigo-900/70 to-slate-900/80 p-12 flex-col justify-between backdrop-blur-sm border-r border-white/10">
        <div>
          <div className="flex items-center gap-2 text-white/90">
            <GraduationCap className="w-10 h-10" />
            <span className="text-xl font-bold">Peer Review Platform</span>
          </div>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Collaborate. Review. Improve.
          </h1>
          <p className="text-indigo-100 text-lg max-w-md">
            Join thousands of students who enhance their learning through peer feedback and collaborative projects.
          </p>
          <div className="flex gap-4 text-sm text-white/80">
            <span>✓ Structured peer review</span>
            <span>✓ Real-time collaboration</span>
            <span>✓ Teacher oversight</span>
          </div>
        </div>
        <div className="h-48 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
          <div className="text-center text-white/90">
            <p className="text-sm">Illustration placeholder</p>
            <p className="text-xs opacity-70">Collaboration & feedback</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-transparent">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 rounded-2xl shadow-2xl border border-white/10 bg-slate-900/65 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <GraduationCap className="w-8 h-8 text-indigo-300" />
              <span className="font-bold text-white">Peer Review</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-300 mb-6">
              {mode === 'login' ? 'Sign in to continue to your dashboard' : 'Register first, then login'}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Login works only for registered accounts.
            </p>

            <div className="flex gap-2 p-1 bg-slate-800/70 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-slate-900 text-indigo-300 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-slate-900 text-indigo-300 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {/* Role Selection */}
            <div className="flex gap-2 p-1 bg-slate-800/70 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  role === 'student'
                    ? 'bg-slate-900 text-indigo-300 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  role === 'teacher'
                    ? 'bg-slate-900 text-indigo-300 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Teacher
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900/70 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900/70 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900/70 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Captcha - Math addition */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Captcha</label>
                <div className="flex gap-3 items-center">
                  <div className="flex items-center justify-center gap-1 min-w-[100px] h-12 px-3 bg-slate-800 rounded-lg font-mono text-lg font-bold text-slate-200 select-none">
                    {captcha.a} + {captcha.b} = ?
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    title="Refresh captcha"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Answer"
                      className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900/70 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              {success && (
                <p className="text-sm text-emerald-400">{success}</p>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-400 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-300">Remember me</span>
                </label>
                <a href="#" className="text-sm text-indigo-300 hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium hover:from-indigo-600 hover:to-blue-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all shadow-lg hover:shadow-xl"
              >
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>

      {showRegisterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Registration Successful</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Successfully registered. Please login with the same email and credentials.
            </p>
            <button
              type="button"
              onClick={() => setShowRegisterPopup(false)}
              className="mt-5 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
