import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { periods as api, payroll as payrollApi } from '../../api/payroll'

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
      {status === 'open' ? 'Abierto' : 'Cerrado'}
    </span>
  )
}

function fmt(d) {
  if (!d) return '—'
  // Toma solo los primeros 10 caracteres para evitar offset de timezone
  const iso = String(d).slice(0, 10)
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PeriodsPage() {
  const navigate = useNavigate()
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ name: '', startDate: '', endDate: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [calculating, setCalculating] = useState(null)
  const [calcMsg, setCalcMsg]   = useState('')
  const [exporting, setExporting] = useState(null)
  const [importModal, setImportModal] = useState(null)
  const [importFile, setImportFile]   = useState(null)
  const [importing, setImporting]     = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError]   = useState('')

  const load = () => {
    setLoading(true)
    api.list().then(setList).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleCreate() {
    if (!form.name || !form.startDate || !form.endDate) {
      setError('Todos los campos son requeridos'); return
    }
    setSaving(true); setError('')
    try { await api.create(form); setModal(false); load() }
    catch (e) { setError(e.response?.data?.error || 'Error al crear') }
    finally { setSaving(false) }
  }

  async function toggleStatus(p) {
    if (p.status === 'open') await api.close(p.id).catch(() => {})
    else await api.reopen(p.id).catch(() => {})
    load()
  }

  async function handleCalculate(p) {
    setCalculating(p.id); setCalcMsg('')
    try {
      const res = await payrollApi.calculate(p.id)
      setCalcMsg(res.message || 'Cálculo completado')
    } catch (e) {
      setCalcMsg(e.response?.data?.error || 'Error en el cálculo')
    }
    setCalculating(null)
  }

  async function handleExport(p, format) {
    setExporting(`${p.id}_${format}`)
    try { await payrollApi.export(p.id, format) }
    catch { /* error silencioso - el navegador abre la descarga */ }
    setExporting(null)
  }

  function openImport(p) {
    setImportModal(p)
    setImportFile(null)
    setImportResult(null)
    setImportError('')
  }

  async function handleImport() {
    if (!importFile) { setImportError('Selecciona un archivo .xlsx'); return }
    setImporting(true); setImportError(''); setImportResult(null)
    try {
      const result = await api.importSchedule(importModal.id, importFile)
      setImportResult(result)
      setImportFile(null)
    } catch (e) {
      setImportError(e.response?.data?.error || 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const fld = k => ({ value: form[k], onChange: e => setForm(f => ({...f, [k]: e.target.value})) })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Períodos de nómina</h1>
        </div>
        <button onClick={() => { setForm({ name:'', startDate:'', endDate:'' }); setError(''); setModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Nuevo período
        </button>
      </div>

      {calcMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
          {calcMsg}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Cargando...</div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-400">No hay períodos creados</div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{fmt(p.start_date)} — {fmt(p.end_date)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {p.status === 'open' && (
                    <button onClick={() => handleCalculate(p)} disabled={calculating === p.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border-0 text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                      {calculating === p.id ? 'Calculando...' : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                          Calcular nómina
                        </>
                      )}
                    </button>
                  )}
                  <button onClick={() => handleExport(p, 'xlsx')} disabled={exporting === `${p.id}_xlsx`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-all disabled:opacity-50">
                    {exporting === `${p.id}_xlsx` ? '...' : 'Excel'}
                  </button>
                  <button onClick={() => handleExport(p, 'csv')} disabled={exporting === `${p.id}_csv`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50">
                    {exporting === `${p.id}_csv` ? '...' : 'CSV'}
                  </button>
                  <button onClick={() => navigate(`/payroll/periods/${p.id}/schedule`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Ver cuadro
                  </button>
                  <button onClick={() => openImport(p)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Importar descansos
                  </button>
                  <button onClick={() => toggleStatus(p)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border transition-all ${p.status === 'open' ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' : 'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
                    {p.status === 'open' ? 'Cerrar' : 'Reabrir'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {importModal && (
        <Modal title={`Importar descansos — ${importModal.name}`} onClose={() => setImportModal(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-gray-500">
              Selecciona el cuadro de descansos en formato <strong>.xlsx</strong>. Se importarán los días del período <strong>{fmt(importModal.start_date)} — {fmt(importModal.end_date)}</strong>.
            </p>

            {!importResult ? (
              <>
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${importFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`w-8 h-8 ${importFile ? 'text-indigo-500' : 'text-gray-300'}`}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="text-xs text-gray-500 text-center">
                    {importFile ? importFile.name : 'Haz clic para seleccionar el archivo .xlsx'}
                  </span>
                  <input type="file" accept=".xlsx" className="hidden" onChange={e => { setImportFile(e.target.files[0]); setImportError('') }} />
                </label>
                {importError && <p className="text-red-500 text-xs">{importError}</p>}
                <button onClick={handleImport} disabled={importing || !importFile}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
                  {importing ? 'Importando...' : 'Importar'}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-700">Importación completada</p>
                  <p className="text-xs text-green-600 mt-1">{importResult.recordsUpserted} registros importados para {importResult.period}</p>
                </div>
                {importResult.unmatchedEmployees?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Empleados no encontrados ({importResult.unmatchedEmployees.length})</p>
                    <ul className="text-xs text-amber-600 space-y-0.5 max-h-32 overflow-y-auto">
                      {importResult.unmatchedEmployees.map((n, i) => <li key={i}>• {n}</li>)}
                    </ul>
                  </div>
                )}
                <button onClick={() => setImportModal(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title="Nuevo período de nómina" onClose={() => setModal(false)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre del período *</label>
              <input className={inp} placeholder="Ej: Quincena mayo 2026" {...fld('name')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha inicio *</label>
                <input className={inp} type="date" {...fld('startDate')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha fin *</label>
                <input className={inp} type="date" {...fld('endDate')} />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleCreate} disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60 mt-1"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? 'Creando...' : 'Crear período'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
