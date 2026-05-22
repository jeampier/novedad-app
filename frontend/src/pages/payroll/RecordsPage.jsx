import { useEffect, useState } from 'react'
import { periods as periodsApi, payroll as payrollApi } from '../../api/payroll'

const fmt  = n => Number(n || 0).toLocaleString('es-CO')
const fmtM = n => `$${fmt(n)}`
const fmtH = n => Number(n || 0).toFixed(1)

function printPayslip(record, period) {
  const d   = record.calculation_details || {}
  const ded = d.deductionDetail || {}
  const conceptDedDetail = ded.conceptDeductionDetail || []
  const pct = r => `${(r * 100).toFixed(1)}%`

  const earningRows = [
    { code: 'HORAS_ORD',          label: 'Salario básico' },
    { code: 'AUX_TRANS',          label: 'Auxilio de transporte' },
    { code: 'HORAS_EXT',          label: 'H. extra diurna (25%)' },
    { code: 'HORAS_EXT_DIUR_DOM', label: 'H. extra diurna dom. (75%)' },
    { code: 'HORAS_EXT_NOCT',     label: 'H. extra nocturna (75%)' },
    { code: 'HORAS_EXT_NOCT_DOM', label: 'H. extra nocturna dom. (110%)' },
    { code: 'HORAS_NOC',          label: 'Prima nocturna (35%)' },
    { code: 'HORAS_REC',          label: 'Prima recargo (35%)' },
    { code: 'HORAS_DOM',          label: 'Prima dom. diurna (75%)' },
    { code: 'HORAS_REC_DOM_NOCT', label: 'Prima dom. nocturna (110%)' },
  ].map(c => ({
    ...c,
    value: Number(d.concepts?.[c.code]?.value || 0),
    hours: Number(d.concepts?.[c.code]?.hours || 0),
  })).filter(c => c.value > 0)

  const dedBase        = Number(ded.base || 0)
  const health         = Number(ded.health || 0)
  const pension        = Number(ded.pension || 0)
  const solidarity     = Number(ded.solidarity || 0)
  const healthRate     = Number(ded.healthRate || 0.04)
  const pensionRate    = Number(ded.pensionRate || 0.04)
  const solidarityRate = Number(ded.solidarityRate || 0.01)

  const earnRows = earningRows.map(c => `
    <tr>
      <td>${c.label}</td>
      <td class="num">${c.hours > 0 ? fmtH(c.hours) : '—'}</td>
      <td class="num">${fmtM(c.value)}</td>
    </tr>`).join('')

  const dedRows = [
    `<tr><td>Salud</td><td class="num">${fmtM(dedBase)}</td><td class="num">${pct(healthRate)}</td><td class="num">${fmtM(health)}</td></tr>`,
    `<tr><td>Pensión</td><td class="num">${fmtM(dedBase)}</td><td class="num">${pct(pensionRate)}</td><td class="num">${fmtM(pension)}</td></tr>`,
    solidarity > 0
      ? `<tr><td>Fondo solidaridad</td><td class="num">${fmtM(dedBase)}</td><td class="num">${pct(solidarityRate)}</td><td class="num">${fmtM(solidarity)}</td></tr>`
      : '',
    ...conceptDedDetail.map(cd => `<tr><td>${cd.label}</td><td class="num">—</td><td class="num">—</td><td class="num">${fmtM(cd.value)}</td></tr>`),
  ].join('')

  const periodName  = period?.name || ''
  const periodDates = period ? `${period.start_date} al ${period.end_date}` : ''
  const today       = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Colilla — ${record.employee_name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 24px 32px; }
  .logo-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .company { font-size: 18px; font-weight: 700; color: #02005B; letter-spacing: 1px; }
  .doc-title { font-size: 13px; font-weight: 600; color: #4F46E5; text-align: right; }
  .doc-sub { font-size: 10px; color: #888; text-align: right; margin-top: 2px; }
  hr { border: none; border-top: 2px solid #02005B; margin: 8px 0; }
  .thin-hr { border: none; border-top: 1px solid #ddd; margin: 8px 0; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 12px; }
  .info-item { display: flex; gap: 6px; }
  .info-label { color: #888; white-space: nowrap; }
  .info-val { font-weight: 600; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4F46E5; margin: 12px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th { background: #EEF2FF; color: #4F46E5; font-size: 10px; padding: 4px 6px; text-align: left; }
  th.num, td.num { text-align: right; }
  td { padding: 3px 6px; border-bottom: 1px solid #f0f0f0; }
  tfoot td { font-weight: 700; background: #f8f8ff; border-top: 1px solid #c7d2fe; }
  .net-box { margin: 14px 0 0; padding: 10px 16px; background: #EEF2FF; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
  .net-label { font-size: 12px; font-weight: 600; color: #4F46E5; }
  .net-value { font-size: 20px; font-weight: 700; color: #02005B; }
  .days-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 4px; }
  .day-cell { text-align: center; background: #f9fafb; border-radius: 6px; padding: 4px 2px; }
  .day-val { font-weight: 700; font-size: 13px; }
  .day-lbl { font-size: 9px; color: #888; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; }
  .sig-line { border-top: 1px solid #555; padding-top: 4px; text-align: center; font-size: 10px; color: #666; }
  .footer { margin-top: 16px; font-size: 9px; color: #bbb; text-align: center; }
  @media print { body { padding: 0; } @page { margin: 20mm 18mm; size: A4; } }
</style>
</head>
<body>
<div class="logo-row">
  <div>
    <div class="company">MAQUINOR</div>
    <div style="font-size:10px;color:#888;">NIT: — · Sector metalúrgico</div>
  </div>
  <div>
    <div class="doc-title">Comprobante de pago de nómina</div>
    <div class="doc-sub">${periodName} · ${periodDates}</div>
    <div class="doc-sub">Fecha de emisión: ${today}</div>
  </div>
</div>
<hr/>

<div class="info-grid">
  <div class="info-item"><span class="info-label">Empleado:</span><span class="info-val">${record.employee_name}</span></div>
  <div class="info-item"><span class="info-label">Cargo:</span><span class="info-val">${record.position || '—'}</span></div>
  <div class="info-item"><span class="info-label">Documento:</span><span class="info-val">${record.document || '—'}</span></div>
  <div class="info-item"><span class="info-label">Área / Grupo:</span><span class="info-val">${[record.area, record.group_name].filter(Boolean).join(' · ') || '—'}</span></div>
  <div class="info-item"><span class="info-label">IBC:</span><span class="info-val">${fmtM(record.base_salary)}</span></div>
  <div class="info-item"><span class="info-label">Tarifa hora:</span><span class="info-val">${fmtM(d.hourlyRate)}</span></div>
</div>
<div class="thin-hr"/>

<p class="section-title">Novedades del período</p>
<div class="days-grid">
  <div class="day-cell"><div class="day-val" style="color:#4F46E5">${record.days_worked}</div><div class="day-lbl">Trabajados</div></div>
  <div class="day-cell"><div class="day-val" style="color:#6B7280">${record.rest_days}</div><div class="day-lbl">Descansos</div></div>
  <div class="day-cell"><div class="day-val" style="color:#F59E0B">${record.absence_days}</div><div class="day-lbl">Ausencias</div></div>
  <div class="day-cell"><div class="day-val" style="color:#EF4444">${record.disability_days}</div><div class="day-lbl">Incapacidad</div></div>
  <div class="day-cell"><div class="day-val" style="color:#10B981">${record.vacation_days}</div><div class="day-lbl">Vacaciones</div></div>
  <div class="day-cell"><div class="day-val" style="color:#374151">${Number(record.days_worked||0)+Number(record.rest_days||0)+Number(record.absence_days||0)+Number(record.disability_days||0)+Number(record.vacation_days||0)}</div><div class="day-lbl">Total días</div></div>
</div>

<p class="section-title">Devengos</p>
<table>
  <thead><tr><th>Concepto</th><th class="num">Horas</th><th class="num">Valor</th></tr></thead>
  <tbody>${earnRows}</tbody>
  <tfoot><tr><td colspan="2">Total devengado</td><td class="num">${fmtM(record.gross_pay)}</td></tr></tfoot>
</table>

<p class="section-title">Deducciones</p>
<table>
  <thead><tr><th>Concepto</th><th class="num">Base</th><th class="num">Tasa</th><th class="num">Valor empleado</th></tr></thead>
  <tbody>${dedRows}</tbody>
  <tfoot><tr><td colspan="3">Total deducciones</td><td class="num">${fmtM(record.deductions)}</td></tr></tfoot>
</table>

<div class="net-box">
  <span class="net-label">Neto a pagar</span>
  <span class="net-value">${fmtM(record.net_pay)}</span>
</div>

<div class="signatures">
  <div><div class="sig-line">Firma empleador / Autorizado</div></div>
  <div><div class="sig-line">Firma empleado · ${record.document || ''}</div></div>
</div>

<div class="footer">Documento generado por el sistema de novedades MAQUINOR · ${today}</div>

<script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=800,height=900')
  w.document.write(html)
  w.document.close()
}

// Extraer valor de un concepto del detalle de cálculo
function cv(r, code) {
  return Number(r.calculation_details?.concepts?.[code]?.value || 0)
}
function ch(r, code) {
  return Number(r.calculation_details?.concepts?.[code]?.hours || 0)
}
function dd(r, field) {
  return Number(r.calculation_details?.deductionDetail?.[field] || 0)
}

const EARNING_CONCEPTS = [
  { code: 'HORAS_ORD',          label: 'Salario básico',             color: '#4F46E5' },
  { code: 'AUX_TRANS',          label: 'Auxilio de transporte',      color: '#0891B2' },
  { code: 'HORAS_EXT',          label: 'Extra diurna (25%)',         color: '#059669' },
  { code: 'HORAS_EXT_DIUR_DOM', label: 'Extra diurna dom. (75%)',    color: '#059669' },
  { code: 'HORAS_EXT_NOCT',     label: 'Extra nocturna (75%)',       color: '#059669' },
  { code: 'HORAS_EXT_NOCT_DOM', label: 'Extra nocturna dom. (110%)', color: '#059669' },
  { code: 'HORAS_NOC',          label: 'Prima nocturna (35%)',        color: '#F59E0B' },
  { code: 'HORAS_REC',          label: 'Prima recargo (35%)',         color: '#F59E0B' },
  { code: 'HORAS_DOM',          label: 'Prima dom. diurna (75%)',     color: '#F59E0B' },
  { code: 'HORAS_REC_DOM_NOCT', label: 'Prima dom. nocturna (110%)', color: '#F59E0B' },
]

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  )
}

function DetailModal({ record, period, onClose, onPrint }) {
  const d = record.calculation_details || {}
  const hours = d.hours || {}
  const concepts = d.concepts || {}

  const basicoPay  = cv(record, 'HORAS_ORD')
  const auxTrans   = cv(record, 'AUX_TRANS')
  const extraTotal = ['HORAS_EXT','HORAS_EXT_DIUR_DOM','HORAS_EXT_NOCT','HORAS_EXT_NOCT_DOM']
    .reduce((s, c) => s + cv(record, c), 0)
  const recTotal   = ['HORAS_NOC','HORAS_REC','HORAS_DOM','HORAS_REC_DOM_NOCT']
    .reduce((s, c) => s + cv(record, c), 0)

  const health          = dd(record, 'health')
  const pension         = dd(record, 'pension')
  const solidarity      = dd(record, 'solidarity')
  const dedBase         = dd(record, 'base')
  const healthRate      = dd(record, 'healthRate')    || 0.04
  const pensionRate     = dd(record, 'pensionRate')   || 0.04
  const solidarityRate  = dd(record, 'solidarityRate')|| 0.01
  const conceptDedDetail = d.deductionDetail?.conceptDeductionDetail || []
  const pct = r => `${(r * 100).toFixed(1)}%`

  const earningRows = EARNING_CONCEPTS
    .map(c => ({ ...c, value: cv(record, c.code), hours: ch(record, c.code) }))
    .filter(c => c.value > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{record.employee_name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {record.position}
              {record.group_name ? ` · ${record.group_name}` : ''}
              {record.area ? ` · ${record.area}` : ''}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              IBC: <span className="font-medium text-gray-600">{fmtM(record.base_salary)}</span>
              &nbsp;·&nbsp;
              Tarifa hora: <span className="font-medium text-gray-600">{fmtM(d.hourlyRate)}</span>
              {period && <>&nbsp;·&nbsp;Período: <span className="font-medium text-gray-600">{period.name}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer border-0 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir colilla
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* Resumen */}
          <Section title="Resumen">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Días liquidados', val: record.days_worked,         color: '#4F46E5', money: false },
                { label: 'Total devengado', val: fmtM(record.gross_pay),     color: '#059669', money: true },
                { label: 'Total deduc.',    val: fmtM(record.deductions),    color: '#EF4444', money: true },
                { label: 'Neto a pagar',    val: fmtM(record.net_pay),       color: '#0891B2', money: true, bold: true },
              ].map(({ label, val, color, bold }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: color + '12' }}>
                  <p className={`text-sm ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color }}>{val}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Devengos */}
          <Section title="Devengos">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Concepto</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Horas</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Valor</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">% Dev.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {earningRows.map(c => (
                    <tr key={c.code} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-gray-700">{c.label}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{c.hours > 0 ? fmtH(c.hours) : '—'}</td>
                      <td className="px-3 py-2 text-right font-medium" style={{ color: c.color }}>{fmtM(c.value)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">
                        {record.gross_pay > 0 ? `${((c.value / record.gross_pay) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-gray-700" colSpan={2}>Total devengado</td>
                    <td className="px-3 py-2 text-right font-bold text-green-700">{fmtM(record.gross_pay)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>

          {/* Seguridad social */}
          <Section title="Seguridad social y deducciones">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Concepto</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Base</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Tasa</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Valor empleado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Salud</td>
                    <td className="px-3 py-2 text-right text-gray-500">{fmtM(dedBase)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{pct(healthRate)}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">{fmtM(health)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Pensión</td>
                    <td className="px-3 py-2 text-right text-gray-500">{fmtM(dedBase)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{pct(pensionRate)}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">{fmtM(pension)}</td>
                  </tr>
                  {solidarity > 0 && (
                    <tr>
                      <td className="px-3 py-2 text-gray-700">Fondo solidaridad</td>
                      <td className="px-3 py-2 text-right text-gray-500">{fmtM(dedBase)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">{pct(solidarityRate)}</td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">{fmtM(solidarity)}</td>
                    </tr>
                  )}
                  {conceptDedDetail.map(cd => (
                    <tr key={cd.code}>
                      <td className="px-3 py-2 text-gray-700">
                        {cd.label}
                        {cd.breakdown?.length > 0 && (
                          <span className="ml-2 text-[10px] text-gray-400">
                            ({cd.breakdown.map(b => `${b.days}d ${b.name} ${(b.pct*100).toFixed(0)}%`).join(', ')})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">—</td>
                      <td className="px-3 py-2 text-right text-gray-400">—</td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">{fmtM(cd.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-gray-700" colSpan={3}>Total deducciones empleado</td>
                    <td className="px-3 py-2 text-right font-bold text-red-600">{fmtM(record.deductions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 px-1">
              Empleador: Salud 8.5% · Pensión 12% · ARL (según riesgo) · Parafiscales 9% — no incluidos en nómina empleado.
            </p>
          </Section>

          {/* Novedades */}
          <Section title="Novedades del período">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'Trabajados',    val: record.days_worked,    color: '#4F46E5' },
                { label: 'Descansos',     val: record.rest_days,      color: '#6B7280' },
                { label: 'Ausencias',     val: record.absence_days,   color: '#F59E0B' },
                { label: 'Incapacidades', val: record.disability_days,color: '#EF4444' },
                { label: 'Vacaciones',    val: record.vacation_days,  color: '#10B981' },
                { label: 'Total días',    val: (Number(record.days_worked||0)+Number(record.rest_days||0)+Number(record.absence_days||0)+Number(record.disability_days||0)+Number(record.vacation_days||0)), color: '#374151' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center rounded-xl py-2 px-1" style={{ background: color + '15' }}>
                  <p className="font-bold text-sm" style={{ color }}>{val}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Horas */}
          {Object.values(hours).some(v => v > 0) && (
            <Section title="Horas del período">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Ordinarias',       val: hours.ordinary },
                  { label: 'Ext. diurna',      val: hours.extra },
                  { label: 'Ext. d.dom.',      val: hours.extraDiurDom },
                  { label: 'Ext. nocturna',    val: hours.extraNoct },
                  { label: 'Ext. n.dom.',      val: hours.extraNoctDom },
                  { label: 'Rec. nocturno',    val: hours.night },
                  { label: 'Rec. general',     val: hours.surcharge },
                  { label: 'Rec. dom.',        val: hours.sundayHoliday },
                  { label: 'Rec. dom. noct.',  val: hours.recDomNoct },
                ].filter(h => Number(h.val) > 0).map(({ label, val }) => (
                  <div key={label} className="text-center bg-gray-50 rounded-xl py-2">
                    <p className="font-semibold text-gray-800 text-sm">{fmtH(val)}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
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
    gross:       acc.gross       + Number(r.gross_pay    || 0),
    basico:      acc.basico      + cv(r, 'HORAS_ORD'),
    auxTrans:    acc.auxTrans    + cv(r, 'AUX_TRANS'),
    extras:      acc.extras      + ['HORAS_EXT','HORAS_EXT_DIUR_DOM','HORAS_EXT_NOCT','HORAS_EXT_NOCT_DOM'].reduce((s,c) => s + cv(r,c), 0),
    recargos:    acc.recargos    + ['HORAS_NOC','HORAS_REC','HORAS_DOM','HORAS_REC_DOM_NOCT'].reduce((s,c) => s + cv(r,c), 0),
    health:      acc.health      + dd(r, 'health'),
    pension:     acc.pension     + dd(r, 'pension'),
    solidarity:  acc.solidarity  + dd(r, 'solidarity'),
    deductions:  acc.deductions  + Number(r.deductions   || 0),
    net:         acc.net         + Number(r.net_pay      || 0),
  }), { gross:0, basico:0, auxTrans:0, extras:0, recargos:0, health:0, pension:0, solidarity:0, deductions:0, net:0 })

  async function handleExport(format) {
    setExporting(format)
    try { await payrollApi.export(periodId, format) } catch {}
    setExporting(null)
  }

  const currentPeriod = periods.find(p => String(p.id) === periodId)

  const hasSolidarity = filtered.some(r => dd(r, 'solidarity') > 0)

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Consolidado de nómina</h1>
          {currentPeriod && (
            <p className="text-sm text-gray-400 mt-1">{currentPeriod.name} · {currentPeriod.start_date} → {currentPeriod.end_date}</p>
          )}
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

      {/* KPI bar */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Empleados',        val: fmt(filtered.length),   color: '#4F46E5', prefix: '' },
            { label: 'Básico total',     val: fmt(totals.basico),     color: '#4F46E5', prefix: '$' },
            { label: 'Aux. transporte',  val: fmt(totals.auxTrans),   color: '#0891B2', prefix: '$' },
            { label: 'Extras + recargos',val: fmt(totals.extras + totals.recargos), color: '#F59E0B', prefix: '$' },
            { label: 'Total devengado',  val: fmt(totals.gross),      color: '#059669', prefix: '$' },
            { label: 'Total neto',       val: fmt(totals.net),        color: '#4F46E5', prefix: '$', bold: true },
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
            placeholder="Buscar empleado o documento..."
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
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap sticky left-0 bg-gray-50 z-10">Empleado</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">IBC</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Días</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Básico</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Aux. transp.</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Extras ($)</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Recargos ($)</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Devengado</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Salud 4%</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Pensión 4%</th>
                  {hasSolidarity && <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Solidaridad</th>}
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Total deduc.</th>
                  <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Neto</th>
                  <th className="px-4 py-3 text-center font-medium whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => {
                  const basico     = cv(r, 'HORAS_ORD')
                  const auxTrans   = cv(r, 'AUX_TRANS')
                  const extras     = ['HORAS_EXT','HORAS_EXT_DIUR_DOM','HORAS_EXT_NOCT','HORAS_EXT_NOCT_DOM'].reduce((s,c) => s + cv(r,c), 0)
                  const recargos   = ['HORAS_NOC','HORAS_REC','HORAS_DOM','HORAS_REC_DOM_NOCT'].reduce((s,c) => s + cv(r,c), 0)
                  const health     = dd(r, 'health')
                  const pension    = dd(r, 'pension')
                  const solidarity = dd(r, 'solidarity')

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white z-10">
                        <p className="font-medium text-gray-800 whitespace-nowrap">{r.employee_name}</p>
                        <p className="text-gray-400 text-[10px]">{r.position}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{fmtM(r.base_salary)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{r.days_worked}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium whitespace-nowrap">{fmtM(basico)}</td>
                      <td className="px-4 py-3 text-right text-cyan-700 whitespace-nowrap">{auxTrans > 0 ? fmtM(auxTrans) : '—'}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 whitespace-nowrap">{extras > 0 ? fmtM(extras) : '—'}</td>
                      <td className="px-4 py-3 text-right text-amber-700 whitespace-nowrap">{recargos > 0 ? fmtM(recargos) : '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700 whitespace-nowrap">{fmtM(r.gross_pay)}</td>
                      <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap">{fmtM(health)}</td>
                      <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap">{fmtM(pension)}</td>
                      {hasSolidarity && <td className="px-4 py-3 text-right text-red-400 whitespace-nowrap">{solidarity > 0 ? fmtM(solidarity) : '—'}</td>}
                      <td className="px-4 py-3 text-right font-medium text-red-600 whitespace-nowrap">{fmtM(r.deductions)}</td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-700 whitespace-nowrap">{fmtM(r.net_pay)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setSelected(r)}
                            className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0 whitespace-nowrap">
                            Ver detalle
                          </button>
                          <button onClick={() => printPayslip(r, currentPeriod)}
                            title="Imprimir colilla"
                            className="text-gray-400 hover:text-indigo-600 cursor-pointer bg-transparent border-0 p-0 transition-colors">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                              <rect x="6" y="14" width="12" height="8"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50 border-t-2 border-indigo-100 font-semibold text-xs">
                  <td className="px-4 py-3 text-indigo-800 sticky left-0 bg-indigo-50 z-10 uppercase tracking-wide">
                    Total — {filtered.length} empleados
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-gray-800 whitespace-nowrap">{fmtM(totals.basico)}</td>
                  <td className="px-4 py-3 text-right text-cyan-800 whitespace-nowrap">{fmtM(totals.auxTrans)}</td>
                  <td className="px-4 py-3 text-right text-emerald-800 whitespace-nowrap">{fmtM(totals.extras)}</td>
                  <td className="px-4 py-3 text-right text-amber-800 whitespace-nowrap">{fmtM(totals.recargos)}</td>
                  <td className="px-4 py-3 text-right text-green-800 whitespace-nowrap">{fmtM(totals.gross)}</td>
                  <td className="px-4 py-3 text-right text-red-700 whitespace-nowrap">{fmtM(totals.health)}</td>
                  <td className="px-4 py-3 text-right text-red-700 whitespace-nowrap">{fmtM(totals.pension)}</td>
                  {hasSolidarity && <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">{fmtM(totals.solidarity)}</td>}
                  <td className="px-4 py-3 text-right text-red-800 whitespace-nowrap">{fmtM(totals.deductions)}</td>
                  <td className="px-4 py-3 text-right text-indigo-800 whitespace-nowrap">{fmtM(totals.net)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          record={selected}
          period={currentPeriod}
          onClose={() => setSelected(null)}
          onPrint={() => printPayslip(selected, currentPeriod)}
        />
      )}
    </div>
  )
}
