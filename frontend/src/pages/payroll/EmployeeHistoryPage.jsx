import { useEffect, useState } from 'react'
import { payroll as payrollApi } from '../../api/payroll'
import { employees as employeesApi } from '../../api/payroll'

const fmt  = n => Number(n || 0).toLocaleString('es-CO')
const fmtM = n => `$${fmt(n)}`

function printHistory(employee, records, totals) {
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  const rows = records.map(r => `
    <tr>
      <td>${r.period_name}</td>
      <td class="num">${r.start_date} / ${r.end_date}</td>
      <td class="num">${r.days_worked}</td>
      <td class="num">$${Number(r.gross_pay).toLocaleString('es-CO')}</td>
      <td class="num">$${Number(r.deductions).toLocaleString('es-CO')}</td>
      <td class="num"><strong>$${Number(r.net_pay).toLocaleString('es-CO')}</strong></td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Historial — ${employee.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .company { font-size: 18px; font-weight: 700; color: #02005B; }
  .doc-title { text-align: right; font-size: 13px; font-weight: 600; color: #4F46E5; }
  .doc-sub { text-align: right; font-size: 10px; color: #888; margin-top: 2px; }
  hr { border: none; border-top: 2px solid #02005B; margin: 8px 0; }
  .info { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 20px; margin-bottom: 14px; }
  .info-row { display: flex; gap: 6px; font-size: 11px; }
  .lbl { color: #888; }
  .val { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th { background: #EEF2FF; color: #4F46E5; font-size: 10px; padding: 5px 8px; text-align: left; }
  td { padding: 4px 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
  .num { text-align: right; }
  tfoot td { font-weight: 700; background: #EEF2FF; border-top: 2px solid #c7d2fe; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; }
  .sig-line { border-top: 1px solid #555; padding-top: 4px; text-align: center; font-size: 10px; color: #666; }
  .footer { margin-top: 16px; font-size: 9px; color: #bbb; text-align: center; }
  @media print { body { padding: 0; } @page { margin: 20mm 18mm; size: A4; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="company">MAQUINOR</div>
    <div style="font-size:10px;color:#888">Certificado de ingresos y retenciones</div>
  </div>
  <div>
    <div class="doc-title">Historial de nómina por empleado</div>
    <div class="doc-sub">Fecha de emisión: ${today}</div>
  </div>
</div>
<hr/>
<div class="info">
  <div class="info-row"><span class="lbl">Empleado:</span><span class="val">${employee.name}</span></div>
  <div class="info-row"><span class="lbl">Cargo:</span><span class="val">${employee.position || '—'}</span></div>
  <div class="info-row"><span class="lbl">Documento:</span><span class="val">${employee.document || '—'}</span></div>
  <div class="info-row"><span class="lbl">Grupo / Área:</span><span class="val">${[employee.group_name, employee.area].filter(Boolean).join(' · ') || '—'}</span></div>
  <div class="info-row"><span class="lbl">Salario base:</span><span class="val">$${Number(employee.base_salary).toLocaleString('es-CO')}</span></div>
  <div class="info-row"><span class="lbl">Períodos:</span><span class="val">${records.length}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th>Período</th>
      <th class="num">Fechas</th>
      <th class="num">Días</th>
      <th class="num">Devengado</th>
      <th class="num">Deducciones</th>
      <th class="num">Neto</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="2">Totales acumulados (${records.length} períodos)</td>
      <td class="num">${totals.dias}</td>
      <td class="num">$${totals.bruto.toLocaleString('es-CO')}</td>
      <td class="num">$${totals.deducciones.toLocaleString('es-CO')}</td>
      <td class="num">$${totals.neto.toLocaleString('es-CO')}</td>
    </tr>
  </tfoot>
</table>

<div class="signatures">
  <div><div class="sig-line">Firma y sello empleador</div></div>
  <div><div class="sig-line">Firma empleado · ${employee.document || ''}</div></div>
</div>
<div class="footer">Generado por sistema de novedades MAQUINOR · ${today}</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(html)
  w.document.close()
}

export default function EmployeeHistoryPage() {
  const [employees, setEmployees] = useState([])
  const [empId,     setEmpId]     = useState('')
  const [records,   setRecords]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    employeesApi.list().then(setEmployees).catch(() => {})
  }, [])

  useEffect(() => {
    if (!empId) { setRecords([]); return }
    setLoading(true)
    payrollApi.employeeHistory(empId)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [empId])

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.document || '').includes(search)
  )

  const selected = employees.find(e => String(e.id) === empId)

  const totals = records.reduce((acc, r) => ({
    dias:        acc.dias        + Number(r.days_worked  || 0),
    bruto:       acc.bruto       + Number(r.gross_pay    || 0),
    deducciones: acc.deducciones + Number(r.deductions   || 0),
    neto:        acc.neto        + Number(r.net_pay      || 0),
  }), { dias: 0, bruto: 0, deducciones: 0, neto: 0 })

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Historial por empleado</h1>
          <p className="text-sm text-gray-400 mt-1">Acumulado de nóminas calculadas por período</p>
        </div>
        {selected && records.length > 0 && (
          <button onClick={() => printHistory(selected, records, totals)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer border-0 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimir / Certificado
          </button>
        )}
      </div>

      {/* Selector de empleado */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seleccionar empleado</p>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="Buscar por nombre o documento..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select value={empId} onChange={e => setEmpId(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 bg-white">
            <option value="">— Selecciona un empleado —</option>
            {filtered.map(e => (
              <option key={e.id} value={e.id}>{e.name} {e.document ? `· ${e.document}` : ''}</option>
            ))}
          </select>
        </div>

        {selected && (
          <div className="mt-3 flex gap-6 text-xs text-gray-500">
            <span><span className="text-gray-400">Cargo:</span> <span className="font-medium text-gray-700">{selected.position || '—'}</span></span>
            <span><span className="text-gray-400">Grupo:</span> <span className="font-medium text-gray-700">{selected.group_name || '—'}</span></span>
            <span><span className="text-gray-400">IBC:</span> <span className="font-medium text-gray-700">{fmtM(selected.base_salary)}</span></span>
          </div>
        )}
      </div>

      {/* KPIs acumulados */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Períodos',        val: records.length,      prefix: '',  color: '#4F46E5' },
            { label: 'Total devengado', val: fmt(totals.bruto),   prefix: '$', color: '#059669' },
            { label: 'Total deduc.',    val: fmt(totals.deducciones), prefix: '$', color: '#EF4444' },
            { label: 'Total neto',      val: fmt(totals.neto),    prefix: '$', color: '#0891B2', bold: true },
          ].map(({ label, val, prefix, color, bold }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-center">
              <p className={`${bold ? 'text-lg font-bold' : 'text-base font-semibold'}`} style={{ color }}>
                {prefix}{val}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de períodos */}
      {!empId ? (
        <div className="py-16 text-center text-sm text-gray-400">Selecciona un empleado para ver su historial</div>
      ) : loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Cargando historial...</div>
      ) : records.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">Este empleado no tiene nóminas calculadas aún</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Período</th>
                <th className="px-4 py-3 text-left font-medium">Fechas</th>
                <th className="px-4 py-3 text-right font-medium">Días trab.</th>
                <th className="px-4 py-3 text-right font-medium">H. extras</th>
                <th className="px-4 py-3 text-right font-medium">Devengado</th>
                <th className="px-4 py-3 text-right font-medium">Deducciones</th>
                <th className="px-4 py-3 text-right font-medium">Neto</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.period_name}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.days_worked}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {Number(r.extra_hours) > 0 ? Number(r.extra_hours).toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{fmtM(r.gross_pay)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{fmtM(r.deductions)}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-700">{fmtM(r.net_pay)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      r.period_status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {r.period_status === 'open' ? 'Abierto' : 'Cerrado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-indigo-50 border-t-2 border-indigo-100">
              <tr className="font-semibold text-xs">
                <td className="px-4 py-3 text-indigo-800 uppercase tracking-wide" colSpan={2}>
                  Acumulado — {records.length} períodos
                </td>
                <td className="px-4 py-3 text-right text-gray-800">{totals.dias}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right text-green-800">{fmtM(totals.bruto)}</td>
                <td className="px-4 py-3 text-right text-red-800">{fmtM(totals.deducciones)}</td>
                <td className="px-4 py-3 text-right text-indigo-800">{fmtM(totals.neto)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
