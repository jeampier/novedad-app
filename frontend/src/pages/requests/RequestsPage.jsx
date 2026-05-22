import { useEffect, useState } from 'react'
import { requestsApi } from '../../api/requests'
import { employees as employeesApi, absenceTypes as absenceTypesApi } from '../../api/payroll'

const TYPE_LABELS = { vacaciones: 'Vacaciones', permiso: 'Permiso', incapacidad: 'Incapacidad' }
const TYPE_COLORS = { vacaciones: '#10B981', permiso: '#F59E0B', incapacidad: '#EF4444' }

const STATUS_LABEL = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada', liquidada: 'Liquidada' }
const STATUS_COLOR = {
  pendiente:  'bg-yellow-100 text-yellow-700',
  aprobada:   'bg-green-100  text-green-700',
  rechazada:  'bg-red-100    text-red-700',
  liquidada:  'bg-indigo-100 text-indigo-700',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function NewRequestModal({ employees, absTypes, onSave, onClose }) {
  const [form, setForm] = useState({ type: absTypes[0]?.code || '', employeeId: '', startDate: '', endDate: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.employeeId || !form.startDate || !form.endDate)
      return setError('Empleado, fecha inicio y fecha fin son requeridos')
    setSaving(true); setError('')
    try { await onSave(form); onClose() }
    catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const inp = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Nueva solicitud</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-0 text-2xl leading-none cursor-pointer">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className={inp}>
              {absTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Empleado</label>
            <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)} className={inp}>
              <option value="">— Selecciona —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha inicio</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha fin</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Motivo / observaciones</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)}
              rows={2} className={`${inp} resize-none`} placeholder="Opcional..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent border border-gray-200">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer border-0 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear solicitud'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewModal({ request, action, onConfirm, onClose }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const isApprove = action === 'approve'

  async function handleConfirm() {
    setSaving(true)
    try { await onConfirm(notes); onClose() }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            {isApprove ? '✓ Aprobar solicitud' : '✗ Rechazar solicitud'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {request.employee_name} · {TYPE_LABELS[request.type]} · {request.start_date} → {request.end_date} ({request.days}d)
          </p>
        </div>
        <div className="px-6 py-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {isApprove ? 'Notas de aprobación (opcional)' : 'Motivo de rechazo (recomendado)'}
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500 resize-none"
            placeholder={isApprove ? 'Aprobado...' : 'Indica el motivo del rechazo...'} />
          {isApprove && (
            <p className="text-xs text-green-600 mt-2 bg-green-50 rounded-lg px-3 py-2">
              Al aprobar se creará automáticamente el registro de ausencia en el sistema.
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent border border-gray-200">Cancelar</button>
          <button onClick={handleConfirm} disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer border-0 disabled:opacity-50 ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {saving ? '...' : isApprove ? 'Confirmar aprobación' : 'Confirmar rechazo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RequestRow({ r, onApprove, onReject, onLiquidate }) {
  const color = TYPE_COLORS[r.type]
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800 text-xs">{r.employee_name}</p>
        <p className="text-[10px] text-gray-400">{r.position} {r.group_name ? `· ${r.group_name}` : ''}</p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: color }}>
          {TYPE_LABELS[r.type]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{r.start_date}</td>
      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{r.end_date}</td>
      <td className="px-4 py-3 text-xs text-center font-semibold text-gray-700">{r.days}d</td>
      <td className="px-4 py-3 text-xs text-gray-400 max-w-[140px] truncate">{r.reason || '—'}</td>
      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
        {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString('es-CO') : '—'}
        {r.review_notes && <p className="text-[10px] italic truncate max-w-[120px]">{r.review_notes}</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {r.status === 'pendiente' && (
            <>
              <button onClick={() => onApprove(r)}
                className="text-xs text-green-600 hover:underline cursor-pointer bg-transparent border-0 p-0 font-medium">
                Aprobar
              </button>
              <button onClick={() => onReject(r)}
                className="text-xs text-red-500 hover:underline cursor-pointer bg-transparent border-0 p-0">
                Rechazar
              </button>
            </>
          )}
          {r.status === 'aprobada' && (
            <button onClick={() => onLiquidate(r.id)}
              className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
              Liquidar
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

const TABS = [
  { key: 'pendiente',  label: 'Pendientes' },
  { key: 'aprobada',   label: 'Aprobadas' },
  { key: 'rechazada',  label: 'Rechazadas' },
  { key: 'liquidada',  label: 'Liquidadas' },
  { key: '',           label: 'Todas' },
]

export default function RequestsPage() {
  const [requests,  setRequests]  = useState([])
  const [employees, setEmployees] = useState([])
  const [absTypes,  setAbsTypes]  = useState([])
  const [tab,       setTab]       = useState('pendiente')
  const [loading,   setLoading]   = useState(true)
  const [showNew,   setShowNew]   = useState(false)
  const [reviewing, setReviewing] = useState(null) // { request, action }

  async function load() {
    setLoading(true)
    try { setRequests(await requestsApi.list()) } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    employeesApi.list().then(setEmployees).catch(() => {})
    absenceTypesApi.list().then(d => setAbsTypes(d.filter(t => t.active))).catch(() => {})
  }, [])

  async function handleCreate(form) {
    await requestsApi.create(form)
    await load()
  }

  async function handleApprove(notes) {
    await requestsApi.approve(reviewing.request.id, notes)
    await load()
  }

  async function handleReject(notes) {
    await requestsApi.reject(reviewing.request.id, notes)
    await load()
  }

  async function handleLiquidate(id) {
    await requestsApi.liquidate(id)
    await load()
  }

  const filtered = tab ? requests.filter(r => r.status === tab) : requests

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key ? requests.filter(r => r.status === t.key).length : requests.length
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">RRHH</p>
          <h1 className="text-2xl font-semibold text-gray-800">Solicitudes</h1>
          <p className="text-sm text-gray-400 mt-1">Vacaciones, permisos e incapacidades</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer border-0">
          + Nueva solicitud
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer border-0 bg-transparent ${
              tab === t.key
                ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                : 'text-gray-400 hover:text-gray-600'
            }`}>
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
              }`}>{counts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {tab === 'pendiente' ? 'No hay solicitudes pendientes' : 'Sin resultados en esta categoría'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Empleado</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Inicio</th>
                  <th className="px-4 py-3 text-left font-medium">Fin</th>
                  <th className="px-4 py-3 text-center font-medium">Días</th>
                  <th className="px-4 py-3 text-left font-medium">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Revisado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <RequestRow key={r.id} r={r}
                    onApprove={req => setReviewing({ request: req, action: 'approve' })}
                    onReject={req  => setReviewing({ request: req, action: 'reject' })}
                    onLiquidate={handleLiquidate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewRequestModal employees={employees} absTypes={absTypes} onSave={handleCreate} onClose={() => setShowNew(false)} />
      )}
      {reviewing && (
        <ReviewModal
          request={reviewing.request}
          action={reviewing.action}
          onConfirm={reviewing.action === 'approve' ? handleApprove : handleReject}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  )
}
