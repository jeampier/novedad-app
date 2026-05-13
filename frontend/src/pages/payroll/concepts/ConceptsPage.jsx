import { useEffect, useState, useCallback } from 'react'
import { conceptsApi }  from '../../../api/concepts'
import RuleEditor       from './RuleEditor'
import Simulator        from './Simulator'

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
const sel = "px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white cursor-pointer"

const TYPE_META = {
  earning:   { label: 'Devengo',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  deduction: { label: 'Deducción', bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
  base:      { label: 'Base',      bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  derived:   { label: 'Derivado',  bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500' },
}

const CATEGORIES = [
  'Salario', 'Horas extra', 'Bonificación', 'Seguridad Social',
  'Transporte', 'Vacaciones', 'Incapacidad', 'Otro',
]

const EMPTY_CONCEPT = { code: '', name: '', type: 'earning', category: 'Salario', description: '', active: true }

function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.base
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function Modal({ title, wide, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-md'} max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

function ConceptForm({ concept, onSaved, onCancel }) {
  const isEdit = !!concept
  const [form,   setForm]   = useState(isEdit ? {
    code: concept.code, name: concept.name, type: concept.type,
    category: concept.category, description: concept.description || '', active: concept.active,
  } : EMPTY_CONCEPT)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) { setError('Código y nombre son requeridos'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) await conceptsApi.update(concept.id, form)
      else        await conceptsApi.create(form)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Código *</label>
          <input className={inp} placeholder="Ej: HORA_EXT" value={form.code}
            onChange={e => set('code', e.target.value.toUpperCase())} disabled={isEdit} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
          <input className={inp} placeholder="Ej: Hora extra diurna" value={form.name}
            onChange={e => set('name', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
          <select className={sel + ' w-full'} value={form.type} onChange={e => set('type', e.target.value)}>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
          <select className={sel + ' w-full'} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
        <textarea className={inp + ' resize-none'} rows={2}
          placeholder="Descripción opcional del concepto..."
          value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active}
          onChange={e => set('active', e.target.checked)}
          className="w-4 h-4 rounded accent-indigo-600" />
        <span className="text-sm text-gray-700">Concepto activo</span>
      </label>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer bg-white">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer border-0 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear concepto'}
        </button>
      </div>
    </div>
  )
}

function RuleCard({ rule, onEdit, onDelete, onToggle }) {
  const [del, setDel] = useState(false)

  async function handleDel() {
    setDel(true)
    await onDelete().finally(() => setDel(false))
  }

  const hasConditions = rule.conditions?.rules?.length > 0

  return (
    <div className={`rounded-xl border p-4 transition-all ${rule.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
      <div className="flex items-start gap-3">
        {/* Priority badge */}
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
          {rule.priority}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-sm font-semibold text-gray-800">{rule.name || 'Regla sin nombre'}</p>
            {!rule.active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Inactiva</span>
            )}
          </div>
          <code className="block text-xs font-mono bg-gray-900 text-green-400 rounded-lg px-3 py-2 mb-2 truncate">
            {rule.formula}
          </code>
          {hasConditions && (
            <p className="text-xs text-gray-400">
              {rule.conditions.rules.length} condición{rule.conditions.rules.length > 1 ? 'es' : ''} ·&nbsp;
              {rule.conditions.operator === 'AND' ? 'Todas' : 'Alguna'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Active toggle */}
          <button onClick={onToggle}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer border-0 ${rule.active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.active ? 'translate-x-5' : ''}`} />
          </button>
          <button onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer bg-transparent border-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </button>
          <button onClick={handleDel} disabled={del}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0 disabled:opacity-40">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ConceptsPage() {
  const [concepts,  setConcepts]  = useState([])
  const [variables, setVariables] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [typeFilter,setTypeFilter]= useState('')
  const [catFilter, setCatFilter] = useState('')
  const [onlyActive,setOnlyActive]= useState(false)

  // Detail / navigation
  const [selected,  setSelected]  = useState(null) // concept
  const [rules,     setRules]     = useState([])
  const [rulesLoading, setRulesLoading] = useState(false)

  // Modals
  const [conceptModal,  setConceptModal]  = useState(null)  // null | 'create' | concept (edit)
  const [ruleEditorData, setRuleEditorData] = useState(null) // null | { rule } (null rule = new)
  const [activeTab,     setActiveTab]     = useState('rules') // 'rules' | 'simulator'

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([conceptsApi.list(), conceptsApi.variables()])
      .then(([c, v]) => { setConcepts(c); setVariables(v) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const loadRules = useCallback((conceptId) => {
    setRulesLoading(true)
    conceptsApi.rules.list(conceptId)
      .then(setRules)
      .finally(() => setRulesLoading(false))
  }, [])

  useEffect(() => {
    if (selected) loadRules(selected.id)
    else setRules([])
  }, [selected, loadRules])

  function selectConcept(c) {
    setSelected(c); setRuleEditorData(null); setActiveTab('rules')
  }

  // Filters
  const filtered = concepts.filter(c => {
    if (onlyActive && !c.active) return false
    if (typeFilter && c.type !== typeFilter) return false
    if (catFilter  && c.category !== catFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categories = [...new Set(concepts.map(c => c.category))]

  async function handleDeleteConcept(c) {
    if (!confirm(`¿Eliminar el concepto "${c.name}"? También se eliminarán sus reglas.`)) return
    await conceptsApi.remove(c.id)
    if (selected?.id === c.id) setSelected(null)
    load()
  }

  async function handleToggleConcept(c) {
    await conceptsApi.update(c.id, { ...c, active: !c.active })
    if (selected?.id === c.id) setSelected(prev => ({ ...prev, active: !prev.active }))
    load()
  }

  async function handleDeleteRule(rule) {
    await conceptsApi.rules.remove(selected.id, rule.id)
    loadRules(selected.id)
    load()
  }

  async function handleToggleRule(rule) {
    await conceptsApi.rules.update(selected.id, rule.id, { ...rule, active: !rule.active })
    loadRules(selected.id)
    load()
  }

  const mainView = !selected

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left: Concept list ─────────────────────────────── */}
      <div className={`flex flex-col border-r border-gray-100 bg-gray-50 transition-all ${selected ? 'w-80 shrink-0' : 'flex-1'}`}>
        {/* Header */}
        <div className="px-6 pt-8 pb-5 border-b border-gray-100 bg-white">
          {mainView ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
                <h1 className="text-2xl font-semibold text-gray-800">Conceptos</h1>
                <p className="text-sm text-gray-400 mt-1">Parametrización visual de reglas de nómina</p>
              </div>
              <button onClick={() => setConceptModal('create')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 cursor-pointer border-0 shrink-0"
                style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
                + Nuevo
              </button>
            </div>
          ) : (
            <div>
              <button onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mb-3 cursor-pointer bg-transparent border-0 p-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Todos los conceptos
              </button>
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest">Conceptos</p>
            </div>
          )}

          {/* Filters — only in main view */}
          {mainView && (
            <div className="mt-4 space-y-2">
              <input className={inp + ' bg-white'} placeholder="Buscar por nombre o código..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <div className="flex gap-2">
                <select className={sel + ' flex-1 text-xs'} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="">Todos los tipos</option>
                  {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select className={sel + ' flex-1 text-xs'} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                  <option value="">Todas las categorías</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-indigo-600" />
                <span className="text-xs text-gray-500">Solo activos</span>
              </label>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-10">Cargando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm mb-3">No hay conceptos</p>
              {mainView && (
                <button onClick={() => setConceptModal('create')}
                  className="px-4 py-2 rounded-xl text-white text-sm cursor-pointer border-0"
                  style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
                  Crear primer concepto
                </button>
              )}
            </div>
          ) : mainView ? (
            // Grid en vista principal
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(c => <ConceptCard key={c.id} concept={c} onSelect={selectConcept}
                onEdit={() => setConceptModal(c)} onDelete={() => handleDeleteConcept(c)}
                onToggle={() => handleToggleConcept(c)} />)}
            </div>
          ) : (
            // Lista compacta en vista detalle
            <div className="space-y-1.5">
              {filtered.map(c => (
                <button key={c.id} onClick={() => selectConcept(c)}
                  className={`w-full text-left rounded-xl p-3 transition-all cursor-pointer border-0 ${selected?.id === c.id ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-indigo-50 text-gray-700 border border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-mono text-xs font-bold ${selected?.id === c.id ? 'text-indigo-200' : 'text-indigo-600'}`}>{c.code}</p>
                      <p className={`text-sm font-medium mt-0.5 ${selected?.id === c.id ? 'text-white' : 'text-gray-800'}`}>{c.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!selected && <TypeBadge type={c.type} />}
                      <span className={`text-xs ${selected?.id === c.id ? 'text-indigo-200' : 'text-gray-400'}`}>{c.rules_count} regla{c.rules_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Concept detail ──────────────────────────── */}
      {selected && (
        <div className="flex-1 flex overflow-hidden">
          {/* Detail panel */}
          <div className={`flex flex-col transition-all ${ruleEditorData !== null ? 'w-1/2' : 'flex-1'} border-r border-gray-100`}>
            {/* Concept header */}
            <div className="px-6 pt-8 pb-4 border-b border-gray-100 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-indigo-500">{selected.code}</p>
                  <h2 className="text-xl font-semibold text-gray-800 mt-0.5">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <TypeBadge type={selected.type} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{selected.category}</span>
                    {!selected.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactivo</span>}
                  </div>
                  {selected.description && <p className="text-sm text-gray-400 mt-2">{selected.description}</p>}
                </div>
                <button onClick={() => setConceptModal(selected)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer bg-white transition-colors">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                  Editar
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 -mb-4">
                {[{ key: 'rules', label: 'Reglas' }, { key: 'simulator', label: 'Simulador' }].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-0 border-b-2 ${activeTab === t.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {t.label}
                    {t.key === 'rules' && <span className="ml-1.5 text-xs text-gray-400">({rules.length})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'rules' && (
                <div className="space-y-3">
                  {rulesLoading ? (
                    <p className="text-center text-sm text-gray-400 py-6">Cargando reglas...</p>
                  ) : rules.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-gray-400 text-sm mb-3">Sin reglas configuradas</p>
                      <p className="text-xs text-gray-300 mb-4">Las reglas definen cómo se calcula este concepto</p>
                    </div>
                  ) : (
                    rules.map(rule => (
                      <RuleCard key={rule.id} rule={rule}
                        onEdit={() => setRuleEditorData({ rule })}
                        onDelete={() => handleDeleteRule(rule)}
                        onToggle={() => handleToggleRule(rule)}
                      />
                    ))
                  )}
                  <button
                    onClick={() => setRuleEditorData({ rule: null })}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer bg-transparent flex items-center justify-center gap-2">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
                    Agregar regla
                  </button>
                </div>
              )}

              {activeTab === 'simulator' && (
                <Simulator concept={selected} variables={variables} />
              )}
            </div>
          </div>

          {/* Rule editor panel */}
          {ruleEditorData !== null && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <RuleEditor
                concept={selected}
                rule={ruleEditorData.rule}
                variables={variables}
                onSaved={() => { setRuleEditorData(null); loadRules(selected.id); load() }}
                onCancel={() => setRuleEditorData(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {conceptModal && (
        <Modal
          title={conceptModal === 'create' ? 'Nuevo concepto' : 'Editar concepto'}
          onClose={() => setConceptModal(null)}>
          <ConceptForm
            concept={conceptModal === 'create' ? null : conceptModal}
            onSaved={() => {
              setConceptModal(null)
              if (conceptModal !== 'create' && selected?.id === conceptModal.id) {
                conceptsApi.list().then(cs => {
                  const updated = cs.find(c => c.id === selected.id)
                  if (updated) setSelected(updated)
                  setConcepts(cs)
                })
              } else { load() }
            }}
            onCancel={() => setConceptModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}

// ── ConceptCard (used in grid view) ───────────────────────────────────────────
function ConceptCard({ concept: c, onSelect, onEdit, onDelete, onToggle }) {
  const m = TYPE_META[c.type] || TYPE_META.base
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col gap-3 ${!c.active ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${m.bg} ${m.text}`}>
            {c.code.slice(0, 3)}
          </div>
          <div>
            <p className="font-semibold text-gray-800 leading-tight">{c.name}</p>
            <p className="font-mono text-xs text-gray-400">{c.code}</p>
          </div>
        </div>
        <button onClick={onToggle}
          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer border-0 shrink-0 ${c.active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${c.active ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <TypeBadge type={c.type} />
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{c.category}</span>
      </div>

      {c.description && <p className="text-xs text-gray-400 line-clamp-2">{c.description}</p>}

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          <span className="font-semibold text-gray-600">{c.rules_count}</span> regla{c.rules_count !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-1.5">
          <button onClick={onEdit}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-100 cursor-pointer bg-white transition-all">
            Editar
          </button>
          <button onClick={() => onSelect(c)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer border-0 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
            Ver reglas →
          </button>
        </div>
      </div>
    </div>
  )
}
