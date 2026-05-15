import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const mainModules = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/employees',
    label: 'Empleados',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    path: '/absences',
    label: 'Ausencias',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    path: '/accidents',
    label: 'Accidentes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    path: '/shifts',
    label: 'Turnos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

const payrollModules = [
  { path: '/payroll/concepts',      label: 'Conceptos' },
  { path: '/payroll/schedule',      label: 'Programación' },
  { path: '/payroll/shift-types',   label: 'Tipos de turno' },
  { path: '/payroll/absence-types', label: 'Tipos de ausencia' },
  { path: '/payroll/periods',       label: 'Períodos' },
  { path: '/payroll/records',       label: 'Consolidado' },
  { path: '/payroll/settings',      label: 'Parámetros' },
]

const adminModules = [
  { path: '/admin',         label: 'Panel admin' },
  { path: '/admin/users',   label: 'Usuarios' },
  { path: '/admin/roles',   label: 'Roles y permisos' },
  { path: '/admin/audit',   label: 'Auditoría' },
]

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-3.5 h-3.5 transition-transform duration-200"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin')

  const inPayroll = location.pathname.startsWith('/payroll')
  const inAdmin   = location.pathname.startsWith('/admin')

  const [payrollOpen, setPayrollOpen] = useState(inPayroll)
  const [adminOpen,   setAdminOpen]   = useState(inAdmin)

  useEffect(() => { if (inPayroll) setPayrollOpen(true) }, [inPayroll])
  useEffect(() => { if (inAdmin)   setAdminOpen(true)   }, [inAdmin])

  function handleLogout() { logout(); navigate('/login') }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Sidebar */}
      <aside
        className="flex flex-col fixed top-0 left-0 h-full z-20 overflow-hidden"
        style={{ width: 240, background: 'linear-gradient(180deg, #02005B 0%, #060080 100%)' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="220" cy="60" r="70" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
          <circle cx="220" cy="60" r="45" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="1" />
          <circle cx="-10" cy="380" r="90" fill="none" stroke="rgba(129,140,248,0.1)" strokeWidth="1" />
          <circle cx="200" cy="520" r="50" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
          <circle cx="30" cy="120" r="3" fill="rgba(165,180,252,0.4)" />
          <circle cx="200" cy="200" r="2" fill="rgba(165,180,252,0.3)" />
          <circle cx="50" cy="480" r="2.5" fill="rgba(165,180,252,0.3)" />
        </svg>

        {/* Logo */}
        <div className="relative z-10 px-6 pt-8 pb-6 border-b border-white/10">
          <p className="text-white font-bold text-lg tracking-wide">Novedad App</p>
          <p className="text-indigo-300 text-xs mt-0.5 font-light">Sistema de novedades</p>
        </div>

        {/* Nav principal */}
        <nav className="relative z-10 flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {mainModules.map(m => (
            <NavLink key={m.path} to={m.path} end={m.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ` +
                (isActive ? 'bg-white/15 text-white shadow-sm' : 'text-indigo-200 hover:bg-white/8 hover:text-white')
              }>
              {m.icon}
              {m.label}
            </NavLink>
          ))}

          {/* Sección Nómina */}
          <div className="mt-4">
            <button
              onClick={() => setPayrollOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-all duration-200 cursor-pointer border-0 bg-transparent">
              Nómina
              <ChevronIcon open={payrollOpen} />
            </button>
            {payrollOpen && (
              <div className="mt-1 flex flex-col gap-1">
                {payrollModules.map(m => (
                  <NavLink key={m.path} to={m.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ` +
                      (isActive ? 'bg-white/15 text-white shadow-sm' : 'text-indigo-300 hover:bg-white/8 hover:text-white')
                    }>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {m.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Sección Administración */}
          {isAdmin && (
            <div className="mt-4">
              <button
                onClick={() => setAdminOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold text-indigo-400 uppercase tracking-widest hover:bg-white/5 transition-all duration-200 cursor-pointer border-0 bg-transparent">
                Administración
                <ChevronIcon open={adminOpen} />
              </button>
              {adminOpen && (
                <div className="mt-1 flex flex-col gap-1">
                  {adminModules.map(m => (
                    <NavLink key={m.path} to={m.path} end={m.path === '/admin'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ` +
                        (isActive ? 'bg-white/15 text-white shadow-sm' : 'text-indigo-300 hover:bg-white/8 hover:text-white')
                      }>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {m.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Usuario + logout */}
        <div className="relative z-10 px-4 py-5 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-400/30 flex items-center justify-center text-white text-xs font-semibold uppercase">
              {user?.email?.[0] ?? 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{user?.full_name || user?.email}</p>
              <p className="text-indigo-300 text-xs font-light capitalize">{user?.role || 'Usuario'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-indigo-200 hover:bg-white/10 hover:text-white transition-all duration-200 text-sm cursor-pointer border-0 bg-transparent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 bg-gray-50 min-h-screen" style={{ marginLeft: 240 }}>
        {children}
      </main>
    </div>
  )
}
