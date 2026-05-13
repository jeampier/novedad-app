import { useState } from 'react'
import { conceptsApi } from '../../../api/concepts'

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export default function Simulator({ concept, variables }) {
  const [vals,    setVals]    = useState(() => {
    const init = {}
    variables.forEach(v => { init[v.key] = v.example })
    return init
  })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function runSimulation() {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await conceptsApi.simulate({ conceptId: concept.id, variables: vals })
      setResult(res)
    } catch (e) {
      setError(e.response?.data?.error || 'Error al simular')
    } finally {
      setLoading(false) }
  }

  function setVal(key, value) { setVals(v => ({ ...v, [key]: value })) }

  const groupedVars = variables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = []
    acc[v.category].push(v)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Variable inputs */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Variables de prueba</p>
        <div className="space-y-4">
          {Object.entries(groupedVars).map(([cat, vars]) => (
            <div key={cat}>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{cat}</p>
              <div className="grid grid-cols-2 gap-3">
                {vars.map(v => (
                  <div key={v.key}>
                    <label className="text-xs text-gray-500 mb-1 block">{v.label}</label>
                    <input
                      type="number"
                      value={vals[v.key] ?? ''}
                      onChange={e => setVal(v.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
                      placeholder={String(v.example)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={runSimulation} disabled={loading}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold cursor-pointer border-0 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Calculando...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            Simular cálculo
          </>
        )}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {result && (
        <div className="space-y-3">
          {/* Execution trace */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Reglas evaluadas</p>
          <div className="space-y-2">
            {result.results.map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.skipped ? 'border-gray-100 bg-gray-50' : r.success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${r.skipped ? 'bg-gray-200 text-gray-500' : r.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {r.skipped ? '–' : r.success ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.ruleName || `Regla ${i + 1}`}</p>
                      {!r.skipped && r.formula && (
                        <p className="text-xs font-mono text-gray-400 mt-0.5 truncate max-w-xs">{r.formula}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {r.skipped ? (
                      <span className="text-xs text-gray-400">{r.reason}</span>
                    ) : r.success ? (
                      <span className="text-sm font-bold text-emerald-700">{fmt(r.result)}</span>
                    ) : (
                      <span className="text-xs text-red-500">{r.error}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final result */}
          <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Resultado final</p>
            <p className="text-3xl font-bold text-indigo-800">{fmt(result.finalResult)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
