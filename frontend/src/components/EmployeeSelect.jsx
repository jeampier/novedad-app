import { useEffect, useRef, useState } from 'react'
import { employees as api } from '../api/payroll'

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function EmployeeSelect({ value, onChange, placeholder = 'Seleccionar empleado', disabled = false }) {
  const [list,    setList]    = useState([])
  const [open,    setOpen]    = useState(false)
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    setLoading(true)
    api.list().then(setList).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = list.find(e => String(e.id) === String(value))

  const filtered = list
    .filter(e => e.status === 'active')
    .filter(e => {
      const q = search.toLowerCase()
      return e.name.toLowerCase().includes(q) || (e.document || '').includes(q) || (e.position || '').toLowerCase().includes(q)
    })

  function select(emp) {
    onChange(emp.id)
    setSearch('')
    setOpen(false)
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button type="button" disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-left transition-all outline-none cursor-pointer bg-white
          ${open ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {selected ? (
          <>
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
              {initials(selected.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{selected.name}</p>
              <p className="text-xs text-gray-400 truncate">{selected.document} · {selected.position || 'Sin cargo'}</p>
            </div>
            <button type="button" onClick={clear}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 bg-transparent border-0 cursor-pointer p-0">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="text-gray-400 flex-1">{loading ? 'Cargando empleados...' : placeholder}</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input autoFocus
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Buscar por nombre, documento o cargo..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-56">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Sin resultados</p>
            ) : filtered.map(emp => (
              <button key={emp.id} type="button" onClick={() => select(emp)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-0 bg-transparent cursor-pointer border-b border-gray-50 last:border-0
                  ${String(value) === String(emp.id) ? 'bg-indigo-50' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
                  {initials(emp.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.document} · {emp.position || 'Sin cargo'}</p>
                </div>
                {String(value) === String(emp.id) && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-600 ml-auto shrink-0">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
