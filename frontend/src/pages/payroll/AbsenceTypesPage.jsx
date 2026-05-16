import { useEffect, useState } from 'react'
import { absenceTypes as api, absenceCodeCatalog as catalogApi } from '../../api/payroll'
import { useAuth } from '../../context/AuthContext'

const pctToDisplay = v => (Number(v) * 100).toFixed(0)
const pctFromInput = v => Number(v) / 100

function Badge({ active }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
    }`}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function TypeModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    code:          initial?.code          ?? '',
    name:          initial?.name          ?? '',
    description:   initial?.description   ?? '',
    deduction_pct: initial ? pctToDisplay(initial.deduction_pct) : '0',
    active:        initial?.active        ?? true,
  })
  const [catalog, setCatalog] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const isEdit = !!initial

  useEffect(() => { catalogApi.list().then(setCatalog).catch(() => {}) }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    const pct = Number(form.deduction_pct)
    if (isNaN(pct) || pct < 0 || pct > 100) { setError('El descuento debe ser entre 0 y 100'); return }
    if (!form.code.trim() || !form.name.trim()) { setError('Código y nombre son requeridos'); return }
    setSaving(true); setError('')
    try {
      await onSave({ ...form, deduction_pct: pctFromInput(pct) })
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Editar tipo de ausencia' : 'Nuevo tipo de ausencia'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
              {isEdit ? (
                <>
                  <input value={form.code} disabled
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-50" />
                  <p className="text-[10px] text-gray-400 mt-1">El código no se puede cambiar</p>
                </>
              ) : (
                <select value={form.code} onChange={e => set('code', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                  <option value="">— Selecciona un código —</option>
                  {catalog.map(c => (
                    <option key={c.id} value={c.code}>{c.code} {c.description ? `· ${c.description}` : ''}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descuento por día (%)</label>
              <div className="relative">
                <input
                  type="number" min="0" max="100" step="1"
                  value={form.deduction_pct} onChange={e => set('deduction_pct', e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Ausencia injustificada"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="active-chk" checked={form.active}
              onChange={e => set('active', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <label htmlFor="active-chk" className="text-sm text-gray-700 cursor-pointer">Activo</label>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer border-0 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AbsenceTypesPage() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin' || user?.roles?.includes('admin')

  const [types,   setTypes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // null | 'create' | { type }

  function load() {
    setLoading(true)
    api.list().then(setTypes).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave(data) {
    if (modal === 'create') {
      await api.create(data)
    } else {
      await api.update(modal.type.id, data)
    }
    load()
  }

  async function handleDelete(type) {
    if (!confirm(`¿Eliminar "${type.name}"? Esta acción no se puede deshacer.`)) return
    await api.remove(type.id)
    load()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Tipos de ausencia</h1>
          <p className="text-sm text-gray-400 mt-1">
            Catálogo de ausencias y su impacto en el descuento de nómina. El descuento se aplica por día calendario de ausencia.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModal('create')}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white cursor-pointer border-0 shrink-0 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
            + Nuevo tipo
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando tipos de ausencia...</div>
        ) : types.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No hay tipos de ausencia configurados. Ejecuta <code className="bg-gray-100 px-1 rounded">npm run migrate:absence-types</code> primero.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Código</th>
                <th className="px-5 py-3 text-left font-medium">Nombre</th>
                <th className="px-5 py-3 text-left font-medium">Descripción</th>
                <th className="px-5 py-3 text-center font-medium">Descuento/día</th>
                <th className="px-5 py-3 text-center font-medium">Estado</th>
                {isAdmin && <th className="px-5 py-3 text-center font-medium"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {types.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">{t.code}</code>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{t.name}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs max-w-xs truncate">{t.description || '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center justify-center w-14 py-1 rounded-lg text-xs font-semibold ${
                      Number(t.deduction_pct) > 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-400'
                    }`}>
                      {pctToDisplay(t.deduction_pct)}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center"><Badge active={t.active} /></td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setModal({ type: t })}
                          className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="text-xs text-red-400 hover:text-red-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 px-1">
        El código debe coincidir exactamente con el valor registrado en la programación de turnos (campo "Tipo de ausencia").
        Un descuento de 100% descuenta el día completo; 0% no genera descuento.
      </p>

      {modal && (
        <TypeModal
          initial={modal === 'create' ? null : modal.type}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
