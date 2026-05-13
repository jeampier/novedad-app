import { useState } from 'react'
import FormulaEditor   from './FormulaEditor'
import ConditionBuilder from './ConditionBuilder'
import { conceptsApi } from '../../../api/concepts'

const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"

const EMPTY_RULE = { name: '', formula: '', conditions: { operator: 'AND', rules: [] }, priority: 0, active: true }

export default function RuleEditor({ concept, rule, variables, onSaved, onCancel }) {
  const isEdit = !!rule
  const [form,   setForm]   = useState(isEdit ? {
    name:       rule.name      || '',
    formula:    rule.formula   || '',
    conditions: rule.conditions || { operator: 'AND', rules: [] },
    priority:   rule.priority  ?? 0,
    active:     rule.active    ?? true,
  } : EMPTY_RULE)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [tab,    setTab]    = useState('formula') // 'formula' | 'conditions'

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.formula.trim()) { setError('La fórmula es requerida'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) {
        await conceptsApi.rules.update(concept.id, rule.id, form)
      } else {
        await conceptsApi.rules.create(concept.id, form)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-widest">{concept.code} · {concept.name}</p>
          <h3 className="text-base font-semibold text-gray-800 mt-0.5">{isEdit ? 'Editar regla' : 'Nueva regla'}</h3>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Metadata row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Nombre de la regla</label>
            <input className={inp} placeholder="Ej: Cálculo hora extra diurna"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Prioridad</label>
            <input className={inp} type="number" min="0" max="999"
              value={form.priority} onChange={e => set('priority', Number(e.target.value))} />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active}
            onChange={e => set('active', e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600" />
          <span className="text-sm text-gray-700">Regla activa</span>
        </label>

        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex gap-1">
            {[
              { key: 'formula',    label: 'Fórmula' },
              { key: 'conditions', label: 'Condiciones' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-0 border-b-2 ${tab === t.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
                {t.key === 'conditions' && form.conditions?.rules?.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-600 font-semibold">
                    {form.conditions.rules.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {tab === 'formula' && (
          <div>
            <p className="text-xs text-gray-400 mb-3">
              Escribe la expresión matemática. Usa las variables del panel derecho o escribe su nombre directamente.
            </p>
            <FormulaEditor
              value={form.formula}
              onChange={v => set('formula', v)}
              variables={variables}
              onValidate={conceptsApi.validateFormula}
            />
          </div>
        )}

        {tab === 'conditions' && (
          <div>
            <p className="text-xs text-gray-400 mb-3">
              Define cuándo se aplica esta regla. Sin condiciones, la regla se aplica siempre.
            </p>
            <ConditionBuilder
              conditions={form.conditions}
              onChange={v => set('conditions', v)}
              variables={variables}
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer bg-white transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer border-0 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear regla'}
        </button>
      </div>
    </div>
  )
}
