import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import http from '../../api/client'

const statCards = [
  { key: 'total_users',   label: 'Usuarios totales',    icon: '👥', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'active_users',  label: 'Usuarios activos',    icon: '✅', color: '#059669', bg: '#ECFDF5' },
  { key: 'total_roles',   label: 'Roles configurados',  icon: '🛡️', color: '#0891B2', bg: '#ECFEFF' },
  { key: 'activity_week', label: 'Actividad (7 días)',   icon: '📋', color: '#D97706', bg: '#FFFBEB' },
]

const quickLinks = [
  { path: '/admin/users',   label: 'Gestionar usuarios',     desc: 'Crear, editar y desactivar usuarios' },
  { path: '/admin/roles',   label: 'Roles y permisos',       desc: 'Configurar roles y matriz de permisos' },
  { path: '/admin/audit',   label: 'Registro de auditoría',  desc: 'Actividad del sistema y cambios' },
  { path: '/admin/logins',  label: 'Historial de accesos',   desc: 'Intentos de login y sesiones' },
]

export default function AdminPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    http.get('/admin/audit/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Módulo</p>
        <h1 className="text-2xl font-semibold text-gray-800">Panel de Administración</h1>
        <p className="text-sm text-gray-400 mt-1">Centro de control, seguridad y trazabilidad del sistema.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map(s => (
          <div key={s.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats ? stats[s.key] : <span className="text-gray-300 animate-pulse">—</span>}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Accesos rápidos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {quickLinks.map(q => (
          <Link key={q.path} to={q.path}
            className="group flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 no-underline">
            <div>
              <p className="font-semibold text-gray-800 text-sm mb-0.5">{q.label}</p>
              <p className="text-gray-400 text-xs leading-snug">{q.desc}</p>
            </div>
            <div className="ml-auto self-center text-gray-300 group-hover:text-indigo-400 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
