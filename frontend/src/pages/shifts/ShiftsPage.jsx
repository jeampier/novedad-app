import { useEffect, useState } from 'react'
import http from '../../api/client'
import { useCommand } from '../../hooks/useCommand'
import EmployeeSelect from '../../components/EmployeeSelect'
import { shiftTypes as shiftTypesApi } from '../../api/payroll'

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"

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

const EMPTY = { employeeId: null, newShift: '', effectiveDate: '', reason: '' }

export default function ShiftsPage() {
  const [list,       setList]       = useState([])
  const [shiftTypes, setShiftTypes] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const { execute } = useCommand('ChangeShift')

  const load = () => {
    setLoading(true)
    Promise.all([
      http.get('/shifts').then(r => r.data.data || []),
      shiftTypesApi.list().catch(() => []),
    ]).then(([shifts, types]) => {
      setList(shifts)
      setShiftTypes(types)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  function openModal() { setForm(EMPTY); setError(''); setSuccess(''); setModal(true) }

  async function handleSave() {
    if (!form.employeeId)   { setError('Seleccioná un empleado'); return }
    if (!form.newShift)     { setError('Seleccioná el nuevo turno'); return }
    if (!form.effectiveDate){ setError('Ingresá la fecha efectiva'); return }
    setSaving(true); setError('')
    try {
      await execute({ employeeId: form.employeeId, newShift: form.newShift, effectiveDate: form.effectiveDate, reason: form.reason || undefined })
      setSuccess('Cambio de turno registrado correctamente')
      setModal(false)
      load()
    } catch (e) { setError(e.message || 'Error al registrar') }
    finally { setSaving(false) }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const filtered = list.filter(s =>
    !search || s.employee_name?.toLowerCase().includes(search.toLowerCase())
  )

  const thisMonth   = list.filter(s => isThisMonth(s.created_at)).length
  const uniqueEmps  = new Set(list.map(s => s.employee_id)).size
  const selectedST  = shiftTypes.find(t => t.code === form.newShift)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Personal</p>
          <h1 className="text-2xl font-semibold text-gray-800">Cambios de turno</h1>
          <p className="text-sm text-gray-400 mt-1">Historial de reasignaciones de turno</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Registrar cambio
        </button>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total cambios',   value: list.length,  color: 'text-indigo-700', bg: 'bg-indigo-50' },
          { label: 'Este mes',        value: thisMonth,    color: 'text-blue-700',   bg: 'bg-blue-50' },
          { label: 'Empleados afect.',value: uniqueEmps,   color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input className={inp} placeholder="Buscar por empleado..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm mb-3">No hay cambios de turno registrados</p>
            <button onClick={openModal}
              className="px-4 py-2 rounded-xl text-white text-sm cursor-pointer border-0"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              Registrar primer cambio
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Empleado', 'Turno asignado', 'Fecha efectiva', 'Motivo', 'Registrado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => {
                  const st = shiftTypes.find(t => t.code === s.new_shift)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
                            {(s.employee_name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{s.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {st ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: st.color + '22', color: st.color }}>
                            {st.code} · {st.name}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono text-xs">{s.new_shift}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{fmt(s.effective_date)}</td>
                      <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{s.reason || '—'}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{fmt(s.created_at)}</td>
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
            <h3 className="text-base font-semibold text-gray-800">Registrar cambio de turno</h3>
            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Empleado *</label>
              <EmployeeSelect value={form.employeeId} onChange={v => set('employeeId', v)} />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Nuevo turno *</label>
              {shiftTypes.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3 rounded-xl border border-dashed border-gray-200 text-center">
                  No hay tipos de turno configurados.{' '}
                  <a href="/payroll/shift-types" className="text-indigo-600 underline">Configurar tipos de turno</a>
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {shiftTypes.filter(t => t.active).map(t => (
                    <button key={t.code} type="button" onClick={() => set('newShift', t.code)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all cursor-pointer
                        ${form.newShift === t.code ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${form.newShift === t.code ? 'text-indigo-700' : 'text-gray-700'}`}>{t.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{t.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected shift preview */}
              {selectedST && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-500 flex gap-3">
                  <span>{selectedST.total_hours}h totales</span>
                  <span>{selectedST.ordinary_hours}h ord.</span>
                  {selectedST.extra_hours > 0 && <span>{selectedST.extra_hours}h extra</span>}
                  {selectedST.night_hours  > 0 && <span>{selectedST.night_hours}h noc.</span>}
                  {selectedST.start_time && <span>{selectedST.start_time} – {selectedST.end_time}</span>}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Fecha efectiva *</label>
              <input type="date" className={inp} value={form.effectiveDate} onChange={e => set('effectiveDate', e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Motivo del cambio</label>
              <textarea className={inp + ' resize-none'} rows={3}
                placeholder="Descripción opcional del motivo..."
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
                {saving ? 'Registrando...' : 'Registrar cambio'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
