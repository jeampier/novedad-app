import { useEffect, useState } from 'react'
import { periods as periodsApi, payroll as payrollApi } from '../../api/payroll'

const fmt = n => Number(n || 0).toLocaleString('es-CO')
const fmtH = n => Number(n || 0).toFixed(1)

function DetailModal({ record, onClose }) {
  const d = record.calculation_details || {}
  const breakdown = d.breakdown || []
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{record.employee_name}</h3>
            <p className="text-xs text-gray-400">{record.position} · {record.group_name || record.area}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Días trabajados', val: record.days_worked,  color: '#4F46E5' },
            { label: 'Devengado',       val: `$${fmt(record.gross_pay)}`,   color: '#059669' },
            { label: 'Deducciones',     val: `$${fmt(record.deductions)}`,  color: '#EF4444' },
            { label: 'Neto a pagar',    val: `$${fmt(record.net_pay)}`,     color: '#0891B2', bold: true },
          ].map(({ label, val, color, bold }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-base ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color }}>{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Horas */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resumen de horas</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              ['Ordinarias',  record.ordinary_hours],
              ['Extras',      record.extra_hours],
              ['Nocturnas',   record.night_hours],
              ['Recargos',    record.surcharge_hours],
              ['Dom/Fest',    record.sunday_holiday_hours],
            ].map(([label, val]) => (
              <div key={label} className="text-center bg-gray-50 rounded-xl py-2">
                <p className="font-semibold text-gray-800 text-sm">{fmtH(val)}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Novedades */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Novedades</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              ['Descansos',    record.rest_days,       '#6B7280'],
              ['Ausencias',    record.absence_days,    '#F59E0B'],
              ['Incapacidades',record.disability_days, '#EF4444'],
              ['Vacaciones',   record.vacation_days,   '#10B981'],
            ].map(([label, val, color]) => (
              <div key={label} className="text-center rounded-xl py-2" style={{ background: `${color}15` }}>
                <p className="font-semibold text-sm" style={{ color }}>{val}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info cálculo */}
        {d.hourlyRate && (
          <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            Tarifa hora: <span className="font-medium text-gray-600">${fmt(d.hourlyRate)}</span>
            &nbsp;·&nbsp;
            Deducción empleado: <span className="font-medium text-gray-600">{(d.deductionRate * 100).toFixed(0)}%</span>
            &nbsp;·&nbsp;
            Registros: <span className="font-medium text-gray-600">{breakdown.length} días</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecordsPage() {
  const [periods, setPeriods]   = useState([])
  const [periodId, setPeriodId] = useState('')
  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    periodsApi.list().then(p => {
      setPeriods(p)
      if (p.length > 0) setPeriodId(String(p[0].id))
    })
  }, [])

  useEffect(() => {
    if (!periodId) return
    setLoading(true)
    payrollApi.records(periodId).then(setRecords).finally(() => setLoading(false))
  }, [periodId])

  const filtered = records.filter(r =>
    r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.document || '').includes(search)
  )

  const totals = filtered.reduce((acc, r) => ({
    days:     acc.days     + Number(r.days_worked   || 0),
    ordinary: acc.ordinary + Number(r.ordinary_hours || 0),
    extra:    acc.extra    + Number(r.extra_hours    || 0),
    gross:    acc.gross    + Number(r.gross_pay      || 0),
    ded:      acc.ded      + Number(r.deductions     || 0),
    net:      acc.net      + Number(r.net_pay        || 0),
  }), { days: 0, ordinary: 0, extra: 0, gross: 0, ded: 0, net: 0 })

  async function handleExport(format) {
    setExporting(format)
    try { await payrollApi.export(periodId, format) } catch {}
    setExporting(null)
  }

  const currentPeriod = periods.find(p => String(p.id) === periodId)

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Consolidado de nómina</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={periodId} onChange={e => setPeriodId(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white outline-none focus:border-indigo-500 transition-all">
            {periods.length === 0 && <option value="">Sin períodos</option>}
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {periodId && (
            <>
              <button onClick={() => handleExport('xlsx')} disabled={exporting === 'xlsx'}
                className="px-3 py-2.5 rounded-xl text-xs font-medium border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer transition-all disabled:opacity-50">
                {exporting === 'xlsx' ? 'Exportando...' : 'Excel'}
              </button>
              <button onClick={() => handleExport('csv')} disabled={exporting === 'csv'}
                className="px-3 py-2.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all disabled:opacity-50">
                {exporting === 'csv' ? 'Exportando...' : 'CSV'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Totals bar */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Empleados',       val: filtered.length,      color: '#4F46E5', prefix: '' },
            { label: 'Días trabajados', val: totals.days,          color: '#0891B2', prefix: '' },
            { label: 'H. Ordinarias',   val: fmtH(totals.ordinary),color: '#059669', prefix: '' },
            { label: 'H. Extras',       val: fmtH(totals.extra),   color: '#F59E0B', prefix: '' },
            { label: 'Total devengado', val: fmt(totals.gross),    color: '#059669', prefix: '$' },
            { label: 'Total neto',      val: fmt(totals.net),      color: '#4F46E5', prefix: '$', bold: true },
          ].map(({ label, val, color, prefix, bold }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-center">
              <p className={`${bold ? 'text-lg font-bold' : 'text-base font-semibold'}`} style={{ color }}>
                {prefix}{val}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="Buscar empleado..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando consolidado...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {records.length === 0 ? 'Este período no tiene nómina calculada. Ve a Períodos y presiona "Calcular nómina".' : 'No se encontraron resultados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Empleado', 'Días', 'H. Ord', 'H. Extra', 'H. Noc', 'Dom/Fest', 'Devengado', 'Deduc.', 'Neto', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.employee_name}</p>
                      <p className="text-gray-400 text-xs">{r.position}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.days_worked}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtH(r.ordinary_hours)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtH(r.extra_hours)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtH(r.night_hours)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtH(r.sunday_holiday_hours)}</td>
                    <td className="px-4 py-3 font-medium text-green-700">${fmt(r.gross_pay)}</td>
                    <td className="px-4 py-3 text-red-500">${fmt(r.deductions)}</td>
                    <td className="px-4 py-3 font-bold text-indigo-700">${fmt(r.net_pay)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(r)}
                        className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                        Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-700 text-xs uppercase">Total</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{totals.days}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{fmtH(totals.ordinary)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{fmtH(totals.extra)}</td>
                  <td className="px-4 py-3" colSpan={2} />
                  <td className="px-4 py-3 font-bold text-green-700">${fmt(totals.gross)}</td>
                  <td className="px-4 py-3 font-bold text-red-500">${fmt(totals.ded)}</td>
                  <td className="px-4 py-3 font-bold text-indigo-700">${fmt(totals.net)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {selected && <DetailModal record={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
