import { useEffect, useState } from 'react'
import http from '../../api/client'

const TABS = [
  { key: 'audit',  label: 'Registro de actividad' },
  { key: 'logins', label: 'Historial de accesos' },
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

function LoginBadge({ success }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {success ? 'Exitoso' : 'Fallido'}
    </span>
  )
}

export default function AuditPage() {
  const [tab, setTab]       = useState('audit')
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const url = tab === 'audit' ? '/admin/audit' : '/admin/audit/login-history'
    http.get(url).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [tab])

  const filtered = data.filter(row => {
    const s = search.toLowerCase()
    if (tab === 'audit') return (row.command || '').toLowerCase().includes(s) || (row.user_email || '').toLowerCase().includes(s)
    return (row.email || '').toLowerCase().includes(s) || (row.ip_address || '').toLowerCase().includes(s)
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Administración</p>
        <h1 className="text-2xl font-semibold text-gray-800">Auditoría y Trazabilidad</h1>
        <p className="text-sm text-gray-400 mt-1">Registro de actividades y accesos al sistema.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-0 ${tab === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-400 transition-all"
            placeholder={tab === 'audit' ? 'Buscar por acción o usuario...' : 'Buscar por email o IP...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Sin registros</div>
        ) : tab === 'audit' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Acción', 'Usuario', 'Detalle', 'Fecha'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {row.command}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-800 font-medium text-xs">{row.user_name || '—'}</p>
                      <p className="text-gray-400 text-xs">{row.user_email || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {row.payload ? JSON.stringify(row.payload) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Usuario', 'IP', 'Dispositivo', 'Estado', 'Fecha'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="text-gray-800 font-medium text-xs">{row.user_name || '—'}</p>
                      <p className="text-gray-400 text-xs">{row.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs font-mono">{row.ip_address || '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">{row.user_agent || '—'}</td>
                    <td className="px-5 py-3"><LoginBadge success={row.success} /></td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
