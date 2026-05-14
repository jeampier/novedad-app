import { useEffect, useState } from 'react'
import { shiftTypes as api } from '../../api/payroll'

const EMPTY = {
  name: '', code: '', startTime: '', endTime: '',
  totalHours: '', ordinaryHours: '',
  extraHours: '', extraDiurDomHours: '', extraNoctHours: '', extraNoctDomHours: '',
  nightHours: '', surchargeHours: '', sundayHolidayHours: '', recDomNoctHours: '',
  extraMultiplier: '1.25', extraDiurDomMultiplier: '1.75',
  extraNoctMultiplier: '1.75', extraNoctDomMultiplier: '2.10',
  nightMultiplier: '1.35', surchargeMultiplier: '1.35',
  sundayHolidayMultiplier: '1.75', recDomNoctMultiplier: '2.10',
  color: '#3B82F6', active: true,
}

const inp = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6B7280']

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function HourField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input className={inp} type="number" step="0.5" min="0" max="24"
        name={name} value={value} onChange={onChange} placeholder="0" />
    </div>
  )
}

export default function ShiftTypesPage() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    api.list().then(setList).finally(() => setLoading(false))
  }
  useEffect(load, [])

  function openCreate() { setForm(EMPTY); setError(''); setModal('form') }
  function openEdit(st) {
    setSelected(st)
    setForm({
      name: st.name, code: st.code,
      startTime: st.start_time || '', endTime: st.end_time || '',
      totalHours: st.total_hours, ordinaryHours: st.ordinary_hours,
      extraHours: st.extra_hours, extraDiurDomHours: st.extra_diur_dom_hours ?? 0,
      extraNoctHours: st.extra_noct_hours ?? 0, extraNoctDomHours: st.extra_noct_dom_hours ?? 0,
      nightHours: st.night_hours, surchargeHours: st.surcharge_hours,
      sundayHolidayHours: st.sunday_holiday_hours, recDomNoctHours: st.rec_dom_noct_hours ?? 0,
      extraMultiplier: st.extra_multiplier, extraDiurDomMultiplier: st.extra_diur_dom_multiplier ?? 1.75,
      extraNoctMultiplier: st.extra_noct_multiplier ?? 1.75, extraNoctDomMultiplier: st.extra_noct_dom_multiplier ?? 2.10,
      nightMultiplier: st.night_multiplier, surchargeMultiplier: st.surcharge_multiplier,
      sundayHolidayMultiplier: st.sunday_holiday_multiplier, recDomNoctMultiplier: st.rec_dom_noct_multiplier ?? 2.10,
      color: st.color || '#3B82F6', active: st.active,
    })
    setError(''); setModal('form')
  }

  function change(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSave() {
    if (!form.name || !form.code) { setError('Nombre y código son requeridos'); return }
    setSaving(true); setError('')
    try {
      if (!selected) await api.create(form)
      else await api.update(selected.id, { ...form, active: form.active })
      setModal(null); setSelected(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    setDeleting(id)
    await api.remove(id).catch(() => {})
    setDeleting(null); load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Tipos de turno</h1>
          <p className="text-sm text-gray-400 mt-1">Parametrización de turnos y distribución de horas</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Nuevo tipo
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Cargando...</div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400 text-sm mb-4">No hay tipos de turno configurados</p>
          <button onClick={openCreate}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer border-0"
            style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
            Crear primer turno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(st => (
            <div key={st.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: `${st.color}22`, color: st.color }}>
                    {st.code}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{st.name}</p>
                    <p className="text-xs text-gray-400">
                      {st.start_time && st.end_time ? `${st.start_time} – ${st.end_time}` : 'Sin horario definido'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {st.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Ord.',           val: st.ordinary_hours },
                  { label: 'Ext. diur.',     val: st.extra_hours },
                  { label: 'Ext. d.dom.',    val: st.extra_diur_dom_hours ?? 0 },
                  { label: 'Ext. noct.',     val: st.extra_noct_hours ?? 0 },
                  { label: 'Ext. n.dom.',    val: st.extra_noct_dom_hours ?? 0 },
                  { label: 'Rec. noct.',     val: st.night_hours },
                  { label: 'Rec. gral.',     val: st.surcharge_hours },
                  { label: 'Rec. dom.',      val: st.sunday_holiday_hours },
                  { label: 'Rec. d.noct.',   val: st.rec_dom_noct_hours ?? 0 },
                  { label: 'Total',          val: st.total_hours, bold: true },
                ].filter(r => r.bold || Number(r.val) > 0).map(({ label, val, bold }) => (
                  <div key={label} className="text-center">
                    <p className={`text-sm ${bold ? 'font-bold text-gray-800' : 'font-medium text-gray-700'}`}>{val}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <button onClick={() => openEdit(st)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 cursor-pointer bg-transparent border border-indigo-100 transition-all">
                  Editar
                </button>
                <button onClick={() => handleDelete(st.id)} disabled={deleting === st.id}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 cursor-pointer bg-transparent border border-red-100 transition-all disabled:opacity-40">
                  {deleting === st.id ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'form' && (
        <Modal title={selected ? 'Editar tipo de turno' : 'Nuevo tipo de turno'} onClose={() => { setModal(null); setSelected(null) }}>
          <div className="flex flex-col gap-4">
            {/* Básico */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                <input className={inp} placeholder="Ej: Turno mañana" value={form.name} onChange={change('name')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Código *</label>
                <input className={inp} placeholder="Ej: M" value={form.code} onChange={change('code')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hora inicio</label>
                <input className={inp} type="time" value={form.startTime} onChange={change('startTime')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hora fin</label>
                <input className={inp} type="time" value={form.endTime} onChange={change('endTime')} />
              </div>
            </div>

            {/* Horas */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Distribución de horas</p>
              <div className="grid grid-cols-3 gap-3">
                <HourField label="Total"               name="totalHours"          value={form.totalHours}          onChange={change('totalHours')} />
                <HourField label="Ordinarias"           name="ordinaryHours"       value={form.ordinaryHours}       onChange={change('ordinaryHours')} />
                <HourField label="Extra diurna"         name="extraHours"          value={form.extraHours}          onChange={change('extraHours')} />
                <HourField label="Extra diurna dom."    name="extraDiurDomHours"   value={form.extraDiurDomHours}   onChange={change('extraDiurDomHours')} />
                <HourField label="Extra nocturna"       name="extraNoctHours"      value={form.extraNoctHours}      onChange={change('extraNoctHours')} />
                <HourField label="Extra noct. dom."     name="extraNoctDomHours"   value={form.extraNoctDomHours}   onChange={change('extraNoctDomHours')} />
                <HourField label="Rec. nocturno"        name="nightHours"          value={form.nightHours}          onChange={change('nightHours')} />
                <HourField label="Rec. general"         name="surchargeHours"      value={form.surchargeHours}      onChange={change('surchargeHours')} />
                <HourField label="Rec. dom. diurno"     name="sundayHolidayHours"  value={form.sundayHolidayHours}  onChange={change('sundayHolidayHours')} />
                <HourField label="Rec. dom. nocturno"   name="recDomNoctHours"     value={form.recDomNoctHours}     onChange={change('recDomNoctHours')} />
              </div>
            </div>

            {/* Multiplicadores */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Multiplicadores de pago</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Extra diurna ×',       'extraMultiplier'],
                  ['Extra diurna dom. ×',  'extraDiurDomMultiplier'],
                  ['Extra nocturna ×',     'extraNoctMultiplier'],
                  ['Extra noct. dom. ×',   'extraNoctDomMultiplier'],
                  ['Rec. nocturno ×',      'nightMultiplier'],
                  ['Rec. general ×',       'surchargeMultiplier'],
                  ['Rec. dom. diurno ×',   'sundayHolidayMultiplier'],
                  ['Rec. dom. noct. ×',    'recDomNoctMultiplier'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <input className={inp} type="number" step="0.01" min="0"
                      value={form[key]} onChange={change(key)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Color en calendario</p>
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full cursor-pointer border-2 transition-all"
                    style={{ background: c, borderColor: form.color === c ? '#1E293B' : 'transparent', outline: form.color === c ? '2px solid white' : 'none', outlineOffset: form.color === c ? '-4px' : '0' }} />
                ))}
                <input type="color" value={form.color} onChange={change('color')}
                  className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 overflow-hidden" title="Color personalizado" />
              </div>
            </div>

            {/* Estado */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm text-gray-700">Turno activo</span>
            </label>

            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear tipo de turno'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
