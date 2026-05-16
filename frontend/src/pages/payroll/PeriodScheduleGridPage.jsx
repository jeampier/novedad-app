import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { periods as api } from '../../api/payroll'

const CELL = {
  D: { label: 'D', bg: 'bg-yellow-100 text-yellow-800 font-semibold' },
  I: { label: 'I', bg: 'bg-red-100 text-red-700 font-semibold' },
}

function Cell({ value }) {
  if (!value) return <td className="border border-gray-100 px-1 py-0.5 text-center text-xs text-gray-300">—</td>
  const preset = CELL[value]
  if (preset) return <td className={`border border-gray-100 px-1 py-0.5 text-center text-xs ${preset.bg}`}>{preset.label}</td>
  return <td className="border border-gray-100 px-1 py-0.5 text-center text-xs bg-green-50 text-green-800">{value}</td>
}

function fmt(d) {
  if (!d) return ''
  return new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PeriodScheduleGridPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.scheduleGrid(id)
      .then(setData)
      .catch(() => setError('No se pudo cargar el cuadro'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Cargando cuadro...</div>
  if (error)   return <div className="p-8 text-center text-sm text-red-500">{error}</div>
  if (!data)   return null

  const { period, employees } = data
  const startDay = parseInt(String(period.start_date).slice(8, 10))
  const endDay   = parseInt(String(period.end_date).slice(8, 10))
  const days     = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const restCount = (emp) => Object.values(emp.days).filter(v => v === 'D').length
  const incCount  = (emp) => Object.values(emp.days).filter(v => v === 'I').length
  const workCount = (emp) => Object.values(emp.days).filter(v => v !== 'D' && v !== 'I' && v).length

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <button onClick={() => navigate('/payroll/periods')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer border-0 bg-transparent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </button>
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest">Cuadro de descansos</p>
          <h1 className="text-xl font-semibold text-gray-800">{period.name}</h1>
          <p className="text-xs text-gray-400">{fmt(period.start_date)} — {fmt(period.end_date)}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empleado..."
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 w-56"
        />
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200 inline-block"/>&nbsp;Descanso</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-100 border border-red-200 inline-block"/>&nbsp;Incapacidad</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-50 border border-green-200 inline-block"/>&nbsp;Horas trabajadas</span>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} empleados</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="text-xs border-collapse min-w-full bg-white">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-100 px-3 py-2 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-44">Empleado</th>
              <th className="border border-gray-100 px-2 py-2 text-center font-medium text-gray-500 w-10">Grp</th>
              {days.map(d => (
                <th key={d} className="border border-gray-100 px-1 py-2 text-center font-medium text-gray-500 w-8">{d}</th>
              ))}
              <th className="border border-gray-100 px-2 py-2 text-center font-medium text-green-700 w-10">Trab</th>
              <th className="border border-gray-100 px-2 py-2 text-center font-medium text-yellow-700 w-10">Desc</th>
              <th className="border border-gray-100 px-2 py-2 text-center font-medium text-red-600 w-10">Inc</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="border border-gray-100 px-3 py-1.5 font-medium text-gray-800 sticky left-0 bg-white z-10">{emp.name}</td>
                <td className="border border-gray-100 px-2 py-1.5 text-center text-gray-400">{emp.group || '—'}</td>
                {days.map(d => <Cell key={d} value={emp.days[String(d)]} />)}
                <td className="border border-gray-100 px-2 py-1.5 text-center font-semibold text-green-700">{workCount(emp)}</td>
                <td className="border border-gray-100 px-2 py-1.5 text-center font-semibold text-yellow-700">{restCount(emp)}</td>
                <td className="border border-gray-100 px-2 py-1.5 text-center font-semibold text-red-600">{incCount(emp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
