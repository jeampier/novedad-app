import { useEffect, useState } from 'react'
import { payrollSettings as api, absenceCodeCatalog as catalogApi } from '../../api/payroll'
import { useAuth } from '../../context/AuthContext'

// Metadatos de cada parámetro: cómo mostrarlo y cómo interpretarlo
const PARAM_META = {
  smmlv:              { label: 'SMMLV mensual',              group: 'legal',  type: 'currency', description: 'Salario Mínimo Mensual Legal Vigente. Se usa para calcular auxilio de transporte y fondo de solidaridad.' },
  aux_trans:          { label: 'Auxilio de transporte',       group: 'legal',  type: 'currency', description: 'Valor mensual del auxilio de transporte. Se prorratea por días liquidados.' },
  limite_aux_trans:   { label: 'Límite auxilio transporte',   group: 'legal',  type: 'factor',   description: 'El auxilio aplica cuando IBC ≤ este valor × SMMLV. Ej: 2 significa "hasta 2 salarios mínimos".' },
  tasa_salud:         { label: 'Tasa salud (empleado)',       group: 'ss',     type: 'percent',  description: 'Porcentaje de descuento por salud que asume el empleado. Base legal: 4%.' },
  tasa_pension:       { label: 'Tasa pensión (empleado)',     group: 'ss',     type: 'percent',  description: 'Porcentaje de descuento por pensión que asume el empleado. Base legal: 4%.' },
  tasa_solidaridad:   { label: 'Fondo de solidaridad',        group: 'ss',     type: 'percent',  description: 'Descuento adicional de pensión para salarios altos. Base legal: 1%.' },
  limite_solidaridad: { label: 'Límite solidaridad',          group: 'ss',     type: 'factor',   description: 'El fondo aplica cuando IBC > este valor × SMMLV. Ej: 4 significa "más de 4 salarios mínimos".' },
}

const GROUPS = [
  { key: 'legal', title: 'Parámetros legales', description: 'Valores fijados por ley cada año. Actualizar al inicio de cada vigencia.' },
  { key: 'ss',    title: 'Seguridad social — empleado', description: 'Tasas de descuento que aplican al empleado. Los aportes del empleador se gestionan por separado.' },
]

function formatValue(value, type) {
  const n = Number(value)
  if (type === 'currency') return `$${n.toLocaleString('es-CO')}`
  if (type === 'percent')  return `${(n * 100).toFixed(1)}%`
  if (type === 'factor')   return `${n} × SMMLV`
  return String(n)
}

function toEditValue(value, type) {
  const n = Number(value)
  if (type === 'percent') return (n * 100).toFixed(2)
  return String(n)
}

function fromEditValue(raw, type) {
  const n = Number(raw)
  if (type === 'percent') return n / 100
  return n
}

function SettingRow({ row, meta, onSave, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [input,   setInput]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  function startEdit() {
    setInput(toEditValue(row.value, meta.type))
    setError('')
    setEditing(true)
  }

  function cancel() { setEditing(false); setError('') }

  async function save() {
    if (input === '' || isNaN(Number(input))) { setError('Ingrese un número válido'); return }
    setSaving(true); setError('')
    try {
      await onSave(row.key, fromEditValue(input, meta.type))
      setEditing(false)
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const suffix = meta.type === 'percent' ? '%' : meta.type === 'factor' ? '× SMMLV' : ''
  const prefix = meta.type === 'currency' ? '$' : ''

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{meta.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
              <input
                type="number"
                step={meta.type === 'percent' ? '0.01' : meta.type === 'currency' ? '1000' : '0.5'}
                min="0"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="w-24 text-sm text-gray-800 bg-transparent outline-none text-right"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
              />
              {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
            </div>
            <button onClick={save} disabled={saving}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white cursor-pointer border-0 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? '...' : 'Guardar'}
            </button>
            <button onClick={cancel}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50">
              Cancelar
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl">
              {formatValue(row.value, meta.type)}
            </span>
            {isAdmin && (
              <button onClick={startEdit}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                Editar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AbsenceCatalogSection({ isAdmin }) {
  const [codes,    setCodes]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [newCode,  setNewCode]  = useState('')
  const [newDesc,  setNewDesc]  = useState('')
  const [adding,   setAdding]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error,    setError]    = useState('')

  function load() {
    setLoading(true)
    catalogApi.list().then(setCodes).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleAdd() {
    if (!newCode.trim()) { setError('El código es requerido'); return }
    setAdding(true); setError('')
    try {
      await catalogApi.create({ code: newCode.trim(), description: newDesc.trim() })
      setNewCode(''); setNewDesc(''); setShowForm(false); load()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al agregar')
    } finally { setAdding(false) }
  }

  async function handleDelete(id, code) {
    if (!confirm(`¿Eliminar el código "${code}"?`)) return
    await catalogApi.remove(id)
    load()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Códigos de ausencia</p>
          <p className="text-xs text-gray-400 mt-0.5">Catálogo de códigos válidos. Se usan como opciones al crear un tipo de ausencia.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowForm(v => !v); setError('') }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white cursor-pointer border-0"
            style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
            + Agregar
          </button>
        )}
      </div>

      {showForm && (
        <div className="px-5 py-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Código *</label>
            <input value={newCode} onChange={e => setNewCode(e.target.value)}
              placeholder="ej: licencia_maternidad"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 w-48" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Descripción breve"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 w-64" />
          </div>
          <button onClick={handleAdd} disabled={adding}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer border-0 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
            {adding ? '...' : 'Guardar'}
          </button>
          {error && <p className="text-xs text-red-500 w-full">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Cargando...</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Código</th>
              <th className="px-5 py-3 text-left font-medium">Descripción</th>
              {isAdmin && <th className="px-5 py-3 w-16"/>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {codes.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <code className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">{c.code}</code>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">{c.description || '—'}</td>
                {isAdmin && (
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => handleDelete(c.id, c.code)}
                      className="text-xs text-red-400 hover:text-red-600 cursor-pointer bg-transparent border-0">
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function PayrollSettingsPage() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin' || user?.roles?.includes('admin')

  const [settings, setSettings] = useState([])
  const [loading,  setLoading]  = useState(true)

  function load() {
    setLoading(true)
    api.list().then(setSettings).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave(key, value) {
    await api.update(key, value)
    load()
  }

  const byKey = Object.fromEntries(settings.map(s => [s.key, s]))

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
        <h1 className="text-2xl font-semibold text-gray-800">Parámetros de nómina</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configuración global usada en cada cálculo de nómina. Los cambios aplican desde el próximo cálculo.
        </p>
        {!isAdmin && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Solo los administradores pueden modificar estos valores.
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Cargando parámetros...</div>
      ) : (
        <div className="flex flex-col gap-5">
          {GROUPS.map(group => {
            const rows = Object.entries(PARAM_META)
              .filter(([, m]) => m.group === group.key)
              .map(([key, meta]) => ({ key, meta, row: byKey[key] }))
              .filter(({ row }) => !!row)

            if (!rows.length) return null

            return (
              <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-800">{group.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
                </div>
                <div className="px-5">
                  {rows.map(({ key, meta, row }) => (
                    <SettingRow key={key} row={row} meta={meta} onSave={handleSave} isAdmin={isAdmin} />
                  ))}
                </div>
              </div>
            )
          })}

          <AbsenceCatalogSection isAdmin={isAdmin} />

          <p className="text-xs text-gray-400 px-1">
            Última actualización: {settings.length > 0
              ? new Date(Math.max(...settings.map(s => new Date(s.updated_at)))).toLocaleString('es-CO')
              : '—'}
          </p>
        </div>
      )}
    </div>
  )
}
