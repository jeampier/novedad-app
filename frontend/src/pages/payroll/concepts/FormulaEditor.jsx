import { useEffect, useRef, useState, useCallback } from 'react'

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const g = item[key]
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {})
}

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export default function FormulaEditor({ value, onChange, variables = [], onValidate, previewVars = {} }) {
  const textareaRef   = useRef(null)
  const [suggestions, setSuggestions] = useState([])
  const [suggIdx,     setSuggIdx]     = useState(0)
  const [validation,  setValidation]  = useState(null)
  const [preview,     setPreview]     = useState(null)
  const [validating,  setValidating]  = useState(false)

  // debounced validation + preview
  useEffect(() => {
    if (!value?.trim()) { setValidation(null); setPreview(null); return }
    setValidating(true)
    const t = setTimeout(async () => {
      const v = await onValidate(value)
      setValidation(v)
      setValidating(false)
    }, 450)
    return () => clearTimeout(t)
  }, [value])

  const getCurrentWord = useCallback((el) => {
    const cursor = el.selectionStart
    const before = el.value.slice(0, cursor)
    const m = before.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/)
    return m ? { word: m[1], start: cursor - m[1].length } : null
  }, [])

  function handleChange(e) {
    const val = e.target.value
    onChange(val)
    const w = getCurrentWord(e.target)
    if (w && w.word.length >= 1) {
      const matches = variables.filter(v => v.key.startsWith(w.word) && v.key !== w.word)
      setSuggestions(matches.slice(0, 8))
      setSuggIdx(0)
    } else {
      setSuggestions([])
    }
  }

  function applySuggestion(v) {
    const el = textareaRef.current
    const w  = getCurrentWord(el)
    if (!w) return
    const newVal = value.slice(0, w.start) + v.key + value.slice(el.selectionStart)
    onChange(newVal)
    setSuggestions([])
    setTimeout(() => {
      const pos = w.start + v.key.length
      el.setSelectionRange(pos, pos)
      el.focus()
    }, 0)
  }

  function insertAtCursor(key) {
    const el    = textareaRef.current
    const start = el.selectionStart
    const end   = el.selectionEnd
    const newVal = value.slice(0, start) + key + value.slice(end)
    onChange(newVal)
    setSuggestions([])
    setTimeout(() => {
      el.setSelectionRange(start + key.length, start + key.length)
      el.focus()
    }, 0)
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSuggIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSuggIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Tab' || (e.key === 'Enter' && suggestions.length)) {
      e.preventDefault(); applySuggestion(suggestions[suggIdx])
    }
    if (e.key === 'Escape') setSuggestions([])
  }

  const grouped = groupBy(variables, 'category')

  return (
    <div className="flex gap-4 h-full">
      {/* Editor */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            rows={5}
            spellCheck={false}
            placeholder={'Ej: base_salary / 240 * hours_worked * 1.25'}
            className="w-full font-mono text-sm rounded-xl border border-gray-200 p-4 resize-none outline-none focus:ring-2 transition-all"
            style={{
              background: '#0f172a',
              color: '#86efac',
              caretColor: '#86efac',
              lineHeight: '1.7',
              focusRingColor: '#6366f1',
            }}
          />

          {/* Autocomplete */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-xl z-50 w-80 overflow-hidden">
              {suggestions.map((s, i) => (
                <button key={s.key}
                  onMouseDown={e => { e.preventDefault(); applySuggestion(s) }}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${i === suggIdx ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                  <span>
                    <span className="font-mono text-sm font-semibold text-indigo-700">{s.key}</span>
                    <span className="ml-2 text-xs text-gray-400">{s.label}</span>
                  </span>
                  <span className="text-xs text-gray-300 font-mono">{s.example?.toLocaleString('es-CO')}</span>
                </button>
              ))}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                ↑↓ navegar · Tab insertar · Esc cerrar
              </div>
            </div>
          )}
        </div>

        {/* Validation */}
        <div className="min-h-[24px]">
          {validating && <p className="text-xs text-gray-400 flex items-center gap-1.5"><span className="animate-pulse">●</span> Validando...</p>}
          {!validating && validation?.valid  === true  && (
            <p className="text-xs text-emerald-600 flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Fórmula válida
            </p>
          )}
          {!validating && validation?.valid  === false && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {validation.error}
            </p>
          )}
        </div>

        {/* Quick preview */}
        {validation?.valid && Object.keys(previewVars).length > 0 && (() => {
          return null // preview is in Simulator
        })()}

        {/* Operator helpers */}
        <div className="flex flex-wrap gap-1.5">
          {['+', '-', '*', '/', '(', ')', 'round(', 'max(', 'min(', 'abs('].map(op => (
            <button key={op}
              onMouseDown={e => { e.preventDefault(); insertAtCursor(op) }}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 border border-gray-200 cursor-pointer transition-colors">
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Variables sidebar */}
      <div className="w-56 shrink-0 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Variables</p>
          <p className="text-xs text-gray-400 mt-0.5">Click para insertar</p>
        </div>
        <div className="overflow-y-auto flex-1">
          {Object.entries(grouped).map(([cat, vars]) => (
            <div key={cat}>
              <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 sticky top-0 border-b border-gray-100">
                {cat}
              </p>
              {vars.map(v => (
                <button key={v.key}
                  onMouseDown={e => { e.preventDefault(); insertAtCursor(v.key) }}
                  className="w-full text-left px-4 py-2 border-b border-gray-50 hover:bg-indigo-50 group transition-colors cursor-pointer bg-transparent">
                  <p className="font-mono text-xs font-semibold text-indigo-700 group-hover:text-indigo-900 truncate">{v.key}</p>
                  <p className="text-[10px] text-gray-400 truncate">{v.label}</p>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
