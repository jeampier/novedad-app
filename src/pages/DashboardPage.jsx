import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const cards = [
  {
    path: '/employees',
    label: 'Empleados',
    desc: 'Ingresos y retiros de personal',
    color: '#4F46E5',
    bg: '#EEF2FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    path: '/absences',
    label: 'Ausencias',
    desc: 'Incapacidades y permisos',
    color: '#0891B2',
    bg: '#ECFEFF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    path: '/accidents',
    label: 'Accidentes',
    desc: 'Registro de siniestros',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    path: '/shifts',
    label: 'Turnos',
    desc: 'Cambios de turno',
    color: '#059669',
    bg: '#ECFDF5',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    path: '/payroll/schedule',
    label: 'Programación',
    desc: 'Cuadro operativo mensual',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="7" y1="14" x2="7" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="17" y1="14" x2="17" y2="18"/>
      </svg>
    ),
  },
  {
    path: '/payroll/records',
    label: 'Nómina',
    desc: 'Consolidado y exportación',
    color: '#0E7490',
    bg: '#ECFEFF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>
      </svg>
    ),
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <p className="text-gray-400 text-sm font-light mb-1">{greeting}</p>
        <h1 className="text-gray-800 font-semibold" style={{ fontSize: '1.75rem' }}>
          Panel de novedades
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Gestiona los módulos del sistema desde aquí.
        </p>
      </div>

      {/* Tarjetas de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
        {cards.map(c => (
          <Link
            key={c.path}
            to={c.path}
            className="group flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 no-underline"
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-all duration-200 group-hover:scale-105"
              style={{ background: c.bg, color: c.color }}
            >
              {c.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-base mb-0.5">{c.label}</p>
              <p className="text-gray-400 text-sm leading-snug">{c.desc}</p>
            </div>
            <div className="ml-auto self-center text-gray-300 group-hover:text-gray-400 transition-colors duration-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Fecha actual */}
      <p className="mt-10 text-xs text-gray-300">
        {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
