import { useEffect, useState } from 'react'
import http from '../../api/client'
import { useCommand } from '../../hooks/useCommand'
import EmployeeSelect from '../../components/EmployeeSelect'

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"

const SEVERITIES = [
  { value: 'low',    label: 'Leve',     color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  { value: 'medium', label: 'Moderado', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  { value: 'high',   label: 'Grave',    color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
]

function sevMeta(value) {
  return SEVERITIES.find(s => s.value === value) || { label: value || '—', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' }
}

function fmt(d) {
  if (!d) return '—'
  return new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isThisMonth(d) {
  if (!d) return false
  const now = new Date()
  const date = new Date(d)
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

const EMPTY = { employeeId: null, date: '', location: '', severity: '', description: '' }

export default function AccidentsPage() {
  const [list,    setList]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [sevFilter, setSevFilter] = useState('')
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const { execute } = useCommand('RegisterAccident')

  const load = () => {
    setLoading(true)
    http.get('/accidents').then(r => setList(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  function openModal() { setForm(EMPTY); setError(''); setSuccess(''); setModal(true) }

  async function handleSave() {
    if (!form.employeeId)  { setError('Seleccioná un empleado'); return }
    if (!form.date)        { setError('Ingresá la fecha del accidente'); return }
    if (!form.description) { setError('Ingresá una descripción'); return }
    setSaving(true); setError('')
    try {
      await execute({ employeeId: form.employeeId, date: form.date, description: form.description, severity: form.severity || 'low', location: form.location || undefined })
      setSuccess('Accidente registrado correctamente')
      setModal(false)
      load()
    } catch (e) { setError(e.message || 'Error al registrar') }
    finally { setSaving(false) }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const filtered = list.filter(a => {
    if (sevFilter && a.severity !== sevFilter) return false
    if (search && !a.employee_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const thisMonth = list.filter(a => isThisMonth(a.date)).length
  const graves    = list.filter(a => a.severity === 'high').length
  const moderados = list.filter(a => a.severity === 'medium').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-red-600 uppercase tracking-widest mb-1">Personal</p>
          <h1 className="text-2xl font-semibold text-gray-800">Accidentes</h1>
          <p className="text-sm text-gray-400 mt-1">Registro de siniestros y accidentes laborales</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#991B1B,#DC2626)' }}>
          + Registrar accidente
        </button>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total registrados', value: list.length,  color: 'text-gray-700',   bg: 'bg-gray-50' },
          { label: 'Este mes',          value: thisMonth,    color: 'text-blue-700',   bg: 'bg-blue-50' },
          { label: 'Graves',            value: graves,       color: 'text-red-700',    bg: 'bg-red-50' },
          { label: 'Moderados',         value: moderados,    color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input className={inp + ' flex-1'} placeholder="Buscar por empleado..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 bg-white cursor-pointer">
          <option value="">Toda severidad</option>
          {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm mb-3">No hay accidentes registrados</p>
            <button onClick={openModal}
              className="px-4 py-2 rounded-xl text-white text-sm cursor-pointer border-0"
              style={{ background: 'linear-gradient(135deg,#991B1B,#DC2626)' }}>
              Registrar primer accidente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Empleado', 'Fecha', 'Lugar', 'Severidad', 'Descripción', 'Registrado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => {
                  const sm = sevMeta(a.severity)
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-semibold shrink-0">
                            {(a.employee_name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{a.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{fmt(a.date)}</td>
                      <td className="px-5 py-4 text-gray-500">{a.location || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${sm.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 max-w-xs">
                        <p className="line-clamp-2">{a.description}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{fmt(a.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(false)}>
          <div className="px-6 pt-5 pb-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Registrar accidente</h3>
            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Empleado *</label>
              <EmployeeSelect value={form.employeeId} onChange={v => set('employeeId', v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Fecha del accidente *</label>
                <input type="date" className={inp} value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Lugar</label>
                <input className={inp} placeholder="Sector o área" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Severidad</label>
              <div className="flex gap-2">
                {SEVERITIES.map(s => (
                  <button key={s.value} type="button" onClick={() => set('severity', s.value)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer
                      ${form.severity === s.value ? 'border-transparent ' + s.color : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}>
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Descripción del accidente *</label>
              <textarea className={inp + ' resize-none'} rows={4}
                placeholder="Describí qué ocurrió, cómo y las consecuencias..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer bg-white">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer border-0 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#991B1B,#DC2626)' }}>
                {saving ? 'Registrando...' : 'Registrar accidente'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
