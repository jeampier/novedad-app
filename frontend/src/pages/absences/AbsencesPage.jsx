import { useEffect, useState } from 'react'
import http from '../../api/client'
import { absenceTypes as absenceTypesApi } from '../../api/payroll'
import { useCommand } from '../../hooks/useCommand'
import EmployeeSelect from '../../components/EmployeeSelect'

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"

const TYPE_COLORS = [
  'bg-red-100 text-red-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
]

function buildTypeMeta(types) {
  const map = {}
  types.forEach((t, i) => {
    map[t.code] = { label: t.name, color: TYPE_COLORS[i % TYPE_COLORS.length] }
  })
  return map
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

const EMPTY = { employeeId: null, type: '', startDate: '', endDate: '', reason: '' }

export default function AbsencesPage() {
  const [list,       setList]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [absTypes,   setAbsTypes]   = useState([])

  const { execute } = useCommand('RegisterAbsence')

  useEffect(() => {
    absenceTypesApi.list()
      .then(data => setAbsTypes(data.filter(t => t.active)))
      .catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    http.get('/absences').then(r => setList(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  function openModal() { setForm(EMPTY); setError(''); setSuccess(''); setModal(true) }

  async function handleSave() {
    if (!form.employeeId) { setError('Seleccioná un empleado'); return }
    if (!form.type)       { setError('Seleccioná el tipo de ausencia'); return }
    if (!form.startDate)  { setError('Ingresá la fecha de inicio'); return }
    setSaving(true); setError('')
    try {
      await execute({ employeeId: form.employeeId, type: form.type, startDate: form.startDate, endDate: form.endDate || undefined, reason: form.reason || undefined })
      setSuccess('Ausencia registrada correctamente')
      setModal(false)
      load()
    } catch (e) { setError(e.message || 'Error al registrar') }
    finally { setSaving(false) }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const filtered = list.filter(a => {
    if (typeFilter && a.type !== typeFilter) return false
    if (search && !a.employee_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const typeMeta = buildTypeMeta(absTypes)
  const thisMonth = list.filter(a => isThisMonth(a.created_at)).length
  const byType = Object.fromEntries(absTypes.map(t => [t.code, list.filter(a => a.type === t.code).length]))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Personal</p>
          <h1 className="text-2xl font-semibold text-gray-800">Ausencias</h1>
          <p className="text-sm text-gray-400 mt-1">Registro de incapacidades, vacaciones y permisos</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Registrar ausencia
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
          { label: 'Total registradas', value: list.length, color: 'text-indigo-700', bg: 'bg-indigo-50' },
          { label: 'Este mes',          value: thisMonth,   color: 'text-blue-700',   bg: 'bg-blue-50' },
          ...absTypes.slice(0, 2).map((t, i) => ({
            label: t.name,
            value: byType[t.code] || 0,
            color: i === 0 ? 'text-red-700' : 'text-yellow-700',
            bg:    i === 0 ? 'bg-red-50'    : 'bg-yellow-50',
          })),
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
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 bg-white cursor-pointer">
          <option value="">Todos los tipos</option>
          {absTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm mb-3">No hay ausencias registradas</p>
            <button onClick={openModal}
              className="px-4 py-2 rounded-xl text-white text-sm cursor-pointer border-0"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              Registrar primera ausencia
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Empleado', 'Tipo', 'Desde', 'Hasta', 'Motivo', 'Registrada'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => {
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
                            {(a.employee_name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{a.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {(() => { const tm = typeMeta[a.type] || { label: a.type, color: 'bg-gray-100 text-gray-600' }; return (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${tm.color}`}>{tm.label}</span>
                        )})()}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{fmt(a.start_date)}</td>
                      <td className="px-5 py-4 text-gray-400">{a.end_date ? fmt(a.end_date) : '—'}</td>
                      <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{a.reason || '—'}</td>
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
            <h3 className="text-base font-semibold text-gray-800">Registrar ausencia</h3>
            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Empleado *</label>
              <EmployeeSelect value={form.employeeId} onChange={v => set('employeeId', v)} />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Tipo de ausencia *</label>
              {absTypes.length === 0 ? (
                <p className="text-xs text-gray-400">Cargando tipos...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {absTypes.map(t => (
                    <button key={t.code} type="button" onClick={() => set('type', t.code)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer
                        ${form.type === t.code ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Fecha inicio *</label>
                <input type="date" className={inp} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Fecha fin</label>
                <input type="date" className={inp} value={form.endDate} onChange={e => set('endDate', e.target.value)} min={form.startDate} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Motivo / observaciones</label>
              <textarea className={inp + ' resize-none'} rows={3}
                placeholder="Descripción opcional..."
                value={form.reason} onChange={e => set('reason', e.target.value)} />
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
                style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
                {saving ? 'Registrando...' : 'Registrar ausencia'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
