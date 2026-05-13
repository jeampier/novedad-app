import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Credenciales inválidas. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-100"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="flex w-full max-w-4xl mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ height: '80vh', minHeight: 520 }}>

        {/* Panel izquierdo */}
        <div
          className="relative hidden md:flex flex-col items-center justify-center overflow-hidden"
          style={{ width: '40%', background: 'linear-gradient(160deg, #02005B 60%, #0d0080 100%)' }}
        >
          {/* Elementos geométricos decorativos */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Círculo grande superior derecho */}
            <circle cx="85%" cy="12%" r="90" fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5" />
            <circle cx="85%" cy="12%" r="60" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            {/* Semicírculo inferior izquierdo */}
            <path d="M -40 320 A 120 120 0 0 1 80 320" fill="none" stroke="rgba(129,140,248,0.2)" strokeWidth="1.5" />
            <path d="M -60 340 A 150 150 0 0 1 90 340" fill="none" stroke="rgba(129,140,248,0.12)" strokeWidth="1" />
            {/* Círculo medio izquierdo */}
            <circle cx="8%" cy="55%" r="55" fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="1" />
            {/* Líneas diagonales */}
            <line x1="60%" y1="0" x2="100%" y2="50%" stroke="rgba(165,180,252,0.08)" strokeWidth="1" />
            <line x1="0" y1="80%" x2="50%" y2="100%" stroke="rgba(165,180,252,0.08)" strokeWidth="1" />
            {/* Puntos decorativos */}
            <circle cx="20%" cy="20%" r="2.5" fill="rgba(165,180,252,0.5)" />
            <circle cx="75%" cy="40%" r="2" fill="rgba(165,180,252,0.4)" />
            <circle cx="35%" cy="70%" r="2" fill="rgba(165,180,252,0.4)" />
            <circle cx="90%" cy="75%" r="3" fill="rgba(129,140,248,0.35)" />
            <circle cx="15%" cy="85%" r="2" fill="rgba(165,180,252,0.45)" />
            <circle cx="55%" cy="15%" r="1.5" fill="rgba(165,180,252,0.5)" />
            <circle cx="70%" cy="90%" r="2" fill="rgba(165,180,252,0.3)" />
            <circle cx="45%" cy="50%" r="1.5" fill="rgba(165,180,252,0.25)" />
            {/* Semicírculo superior izquierdo */}
            <path d="M 0 0 A 80 80 0 0 1 80 0" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
          </svg>

          {/* Texto central */}
          <div className="relative z-10 text-center select-none px-8">
            <p
              className="text-white mb-2"
              style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '0.05em' }}
            >
              Hello!
            </p>
            <p
              className="text-white"
              style={{ fontSize: '1rem', fontWeight: 300, letterSpacing: '0.1em', opacity: 0.8 }}
            >
              Have a
            </p>
            <p
              className="text-white"
              style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1.1 }}
            >
              GOOD DAY
            </p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex flex-col items-center justify-center bg-white px-10 py-12" style={{ width: '60%', flexGrow: 1 }}>
          <div className="w-full max-w-sm">
            <h1
              className="text-gray-800 mb-1"
              style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.01em' }}
            >
              Login
            </h1>
            <p className="text-gray-400 text-sm mb-8">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Username */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 outline-none transition-all duration-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 outline-none transition-all duration-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Forgot password */}
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
                >
                  forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-500 text-xs text-center -mt-1">{error}</p>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-1 rounded-xl text-white text-sm font-semibold tracking-wide shadow-md transition-all duration-200 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #02005B 0%, #0d0080 100%)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg, #0d0080 0%, #1a00b3 100%)' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg, #02005B 0%, #0d0080 100%)' }}
              >
                {loading ? 'Ingresando...' : 'Sign In'}
              </button>
            </form>

            {/* Footer link */}
            <p className="text-center text-xs text-gray-400 mt-8">
              Don&apos;t have any account?{' '}
              <button
                type="button"
                className="text-indigo-600 font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
