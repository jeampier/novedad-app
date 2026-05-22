import { useEffect, useState } from 'react'
import { rateRules as api } from '../../api/payroll'

const MULTIPLIERS = [
  { key: 'extra_multiplier',          label: 'Extra diurna',         default: 1.25 },
  { key: 'extra_diur_dom_multiplier', label: 'Extra diurna dom.',    default: 1.75 },
  { key: 'extra_noct_multiplier',     label: 'Extra nocturna',       default: 1.75 },
  { key: 'extra_noct_dom_multiplier', label: 'Extra nocturna dom.',  default: 2.10 },
  { key: 'night_multiplier',          label: 'Rec. nocturno',        default: 1.35 },
  { key: 'surcharge_multiplier',      label: 'Rec. general',         default: 1.35 },
  { key: 'sunday_holiday_multiplier', label: 'Rec. dom. diurno',     default: 1.75 },
  { key: 'rec_dom_noct_multiplier',   label: 'Rec. dom. nocturno',   default: 2.10 },
]

const EMPTY = MULTIPLIERS.reduce((acc, m) => ({ ...acc, [m.key]: '' }), {
  group_name: '', position: '', notes: '',
})

function RuleModal({ rule, onSave, onClose }) {
  const [form, setForm] = useState(rule
    ? { ...rule, ...MULTIPLIERS.reduce((a, m) => ({ ...a, [m.key]: rule[m.key] ?? '' }), {}) }
    : { ...EMPTY }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.group_name && !form.position) {
      setError('Debe especificar al menos grupo o cargo')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        group_name: form.group_name || null,
        position:   form.position   || null,
        notes:      form.notes      || null,
        ...MULTIPLIERS.reduce((acc, m) => ({
          ...acc,
          [m.key]: form[m.key] !== '' ? Number(form[m.key]) : null,
        }), {}),
      }
      await onSave(payload)
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            {rule ? 'Editar regla de tasas' : 'Nueva regla de tasas'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-0 text-2xl leading-none cursor-pointer">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grupo <span className="text-gray-400">(vacío = todos)</span></label>
              <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
                value={form.group_name} onChange={e => set('group_name', e.target.value)}
                placeholder="Ej: OPERARIOS" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cargo <span className="text-gray-400">(vacío = todos)</span></label>
              <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
                value={form.position} onChange={e => set('position', e.target.value)}
                placeholder="Ej: SUPERVISOR" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Multiplicadores — vacío = usa el del turno
            </p>
            <div className="grid grid-cols-2 gap-3">
              {MULTIPLIERS.map(m => (
                <div key={m.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {m.label} <span className="text-gray-400">(def. {m.default}×)</span>
                  </label>
                  <input type="number" step="0.01" min="1" max="5"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
                    value={form[m.key]} onChange={e => set(m.key, e.target.value)}
                    placeholder={String(m.default)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notas</label>
            <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Descripción o referencia del Excel" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent border border-gray-200">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer border-0 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MulBadge({ value, def }) {
  if (value === null || value === undefined) return <span className="text-gray-300 text-xs">—</span>
  const v = Number(value)
  const color = v !== def ? 'text-indigo-700 font-semibold' : 'text-gray-500'
  return <span className={`text-xs ${color}`}>{v.toFixed(2)}×</span>
}

export default function PayrollRateRulesPage() {
  const [rules, setRules]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // null | 'new' | rule object
  const [deleting, setDeleting] = useState(null)

  async function load() {
    setLoading(true)
    try { setRules(await api.list()) } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleSave(payload) {
    if (modal && modal.id) await api.update(modal.id, payload)
    else                   await api.create(payload)
    await load()
  }

  async function handleDelete(rule) {
    setDeleting(rule.id)
    try { await api.remove(rule.id); await load() } catch {} finally { setDeleting(null) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Tasas por grupo / cargo</h1>
          <p className="text-sm text-gray-400 mt-1">
            Las reglas anulan los multiplicadores del turno. Más específica = mayor prioridad.
          </p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer border-0 transition-all">
          + Nueva regla
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : rules.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Sin reglas — todos los empleados usan los multiplicadores del turno.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Grupo</th>
                  <th className="px-4 py-3 text-left font-medium">Cargo</th>
                  {MULTIPLIERS.map(m => (
                    <th key={m.key} className="px-3 py-3 text-center font-medium whitespace-nowrap">{m.label}</th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium">Notas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rules.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {r.group_name
                        ? <span className="font-medium text-gray-800">{r.group_name}</span>
                        : <span className="text-gray-300 italic">todos</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.position
                        ? <span className="font-medium text-gray-800">{r.position}</span>
                        : <span className="text-gray-300 italic">todos</span>}
                    </td>
                    {MULTIPLIERS.map(m => (
                      <td key={m.key} className="px-3 py-3 text-center">
                        <MulBadge value={r[m.key]} def={m.default} />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-gray-400">{r.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal(r)}
                          className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(r)} disabled={deleting === r.id}
                          className="text-xs text-red-500 hover:underline cursor-pointer bg-transparent border-0 p-0 disabled:opacity-40">
                          {deleting === r.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-700">
        <strong>Prioridad de resolución:</strong> (Grupo + Cargo) &gt; (Solo Grupo) &gt; (Solo Cargo) &gt; Turno.
        Un campo en blanco significa "aplica a cualquier valor". Los campos vacíos del multiplicador heredan del turno.
      </div>

      {modal && (
        <RuleModal
          rule={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
