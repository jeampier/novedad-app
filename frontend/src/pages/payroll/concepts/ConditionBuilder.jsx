const COMPARATORS = [
  { value: 'gt',  label: 'mayor que' },
  { value: 'gte', label: 'mayor o igual' },
  { value: 'lt',  label: 'menor que' },
  { value: 'lte', label: 'menor o igual' },
  { value: 'eq',  label: 'igual a' },
  { value: 'ne',  label: 'distinto de' },
]

const sel = "px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white cursor-pointer"
const inp = "px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-28"

export default function ConditionBuilder({ conditions, onChange, variables = [] }) {
  const current = (conditions?.rules !== undefined) ? conditions : { operator: 'AND', rules: [] }

  function setOperator(op) { onChange({ ...current, operator: op }) }

  function addRule() {
    onChange({ ...current, rules: [...current.rules, { variable: variables[0]?.key || 'base_salary', comparator: 'gt', value: 0 }] })
  }

  function updateRule(i, patch) {
    const rules = current.rules.map((r, idx) => idx === i ? { ...r, ...patch } : r)
    onChange({ ...current, rules })
  }

  function removeRule(i) {
    onChange({ ...current, rules: current.rules.filter((_, idx) => idx !== i) })
  }

  const hasRules = current.rules.length > 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Se aplica si se cumplen</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {['AND', 'OR'].map(op => (
            <button key={op}
              onClick={() => setOperator(op)}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer border-0 ${current.operator === op ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              {op === 'AND' ? 'TODAS' : 'ALGUNA'}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">las condiciones</span>
      </div>

      {/* Rules */}
      {hasRules ? (
        <div className="space-y-2">
          {current.rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <select value={rule.variable} onChange={e => updateRule(i, { variable: e.target.value })} className={sel}>
                {variables.map(v => <option key={v.key} value={v.key}>{v.label} ({v.key})</option>)}
              </select>
              <select value={rule.comparator} onChange={e => updateRule(i, { comparator: e.target.value })} className={sel}>
                {COMPARATORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input type="number" value={rule.value} onChange={e => updateRule(i, { value: e.target.value })}
                className={inp} placeholder="0" />
              <button onClick={() => removeRule(i)}
                className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-400">Sin condiciones — la regla se aplica siempre</p>
        </div>
      )}

      <button onClick={addRule}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer bg-transparent border-0 p-0">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
        Agregar condición
      </button>
    </div>
  )
}
