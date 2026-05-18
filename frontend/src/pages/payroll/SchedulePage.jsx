import { useEffect, useState, useCallback } from 'react'
import { schedule as schedApi, shiftTypes as stApi, absenceTypes as atApi } from '../../api/payroll'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const WEEK   = ['D','L','M','X','J','V','S']

// descanso no existe en absence_types — mapea a isRestDay:true en la DB
const DESCANSO = { value: 'descanso', label: 'Descanso', color: '#6B7280' }

const DEFAULT_COLORS = {
  ausencia:    '#F59E0B',
  incapacidad: '#EF4444',
  vacaciones:  '#10B981',
  permiso:     '#8B5CF6',
}
const FALLBACK_COLOR = '#64748B'

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}

function processData(rows, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const days        = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const empMap      = {}
  const schedMap    = {}

  for (const row of rows) {
    if (!empMap[row.employee_id]) {
      empMap[row.employee_id] = {
        id: row.employee_id, name: row.employee_name,
        position: row.position, group: row.group_name,
      }
    }
    if (row.schedule_date) {
      const d = parseInt(row.schedule_date.split('-')[2])
      schedMap[`${row.employee_id}_${d}`] = {
        id: row.id, shiftTypeId: row.shift_type_id,
        code: row.shift_code, color: row.shift_color,
        isRestDay: row.is_rest_day, absenceType: row.absence_type,
        notes: row.notes,
      }
    }
  }
  return { employees: Object.values(empMap).sort((a,b) => a.name.localeCompare(b.name)), days, schedMap }
}

function dayLabel(year, month, day) {
  const d = new Date(year, month - 1, day)
  const w = WEEK[d.getDay()]
  const isSun = d.getDay() === 0
  return { label: w, isSun }
}

function CellContent({ entry, absenceTypes }) {
  if (!entry) return <span className="text-gray-200 text-xs">—</span>
  if (entry.isRestDay || entry.absenceType === 'descanso') {
    return <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>D</span>
  }
  if (entry.absenceType) {
    const ab = absenceTypes.find(a => a.value === entry.absenceType)
    return (
      <span className="text-xs font-bold" style={{ color: ab?.color || FALLBACK_COLOR }}>
        {entry.absenceType.slice(0,2).toUpperCase()}
      </span>
    )
  }
  if (entry.code) {
    return (
      <span className="text-xs font-bold leading-none" style={{ color: entry.color || '#1E3A5F' }}>
        {entry.code}
      </span>
    )
  }
  return null
}

function CellBg({ entry, absenceTypes }) {
  if (!entry) return '#F9FAFB'
  if (entry.isRestDay || entry.absenceType === 'descanso') return '#F3F4F6'
  if (entry.absenceType) {
    const ab = absenceTypes.find(a => a.value === entry.absenceType)
    return hexToRgba(ab?.color || FALLBACK_COLOR, 0.12)
  }
  if (entry.color) return hexToRgba(entry.color, 0.15)
  return '#EEF2FF'
}

function EditModal({ empName, day, month, year, entry, shiftTypesList, absenceTypes, onSave, onClear, onClose }) {
  const [saving, setSaving] = useState(false)

  async function pick(type, value) {
    setSaving(true)
    await onSave(type, value)
    setSaving(false)
    onClose()
  }

  async function clear() {
    setSaving(true)
    await onClear()
    setSaving(false)
    onClose()
  }

  const date = new Date(year, month - 1, day)
  const dateStr = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-800 text-sm">{empName}</p>
            <p className="text-xs text-gray-400 capitalize">{dateStr}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
        </div>

        {saving && <div className="text-center py-4 text-sm text-gray-400">Guardando...</div>}

        {!saving && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Turno</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {shiftTypesList.filter(st => st.active).map(st => (
                <button key={st.id} onClick={() => pick('shift', st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all hover:opacity-80 ${entry?.shiftTypeId === st.id ? 'ring-2 ring-offset-1' : ''}`}
                  style={{
                    background: hexToRgba(st.color || '#3B82F6', 0.15),
                    color: st.color || '#3B82F6',
                    borderColor: st.color || '#3B82F6',
                    ringColor: st.color,
                  }}>
                  {st.code}
                  <span className="ml-1 font-normal text-gray-500">{st.name}</span>
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Novedad</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {absenceTypes.map(ab => (
                <button key={ab.value} onClick={() => pick('absence', ab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all hover:opacity-80 ${(entry?.absenceType === ab.value || (ab.value === 'descanso' && entry?.isRestDay)) ? 'ring-2 ring-offset-1' : ''}`}
                  style={{ background: hexToRgba(ab.color, 0.12), color: ab.color, borderColor: ab.color }}>
                  {ab.label}
                </button>
              ))}
            </div>

            {entry && (
              <button onClick={clear}
                className="w-full py-2 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 cursor-pointer bg-transparent transition-all">
                Limpiar celda
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [rows, setRows]   = useState([])
  const [shiftTypesList, setShiftTypesList] = useState([])
  const [absenceTypesList, setAbsenceTypesList] = useState([DESCANSO])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { empId, empName, day }
  const [schedMap, setSchedMap] = useState({})
  const [employees, setEmployees] = useState([])
  const [days, setDays] = useState([])
  const [filterGroup, setFilterGroup] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, types, absTypes] = await Promise.all([
        schedApi.list(year, month),
        stApi.list(),
        atApi.list(),
      ])
      setRows(data)
      setShiftTypesList(types)
      setAbsenceTypesList([
        DESCANSO,
        ...absTypes.filter(a => a.active).map(a => ({
          value: a.code,
          label: a.name,
          color: DEFAULT_COLORS[a.code] || FALLBACK_COLOR,
        })),
      ])
      const processed = processData(data, year, month)
      setEmployees(processed.employees)
      setDays(processed.days)
      setSchedMap(processed.schedMap)
    } finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const groups = [...new Set(employees.map(e => e.group).filter(Boolean))]
  const visibleEmps = filterGroup ? employees.filter(e => e.group === filterGroup) : employees

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function openEdit(emp, day) {
    setEditing({ empId: emp.id, empName: emp.name, day })
  }

  async function handleSave(type, value) {
    const pad = String(month).padStart(2,'0')
    const dd  = String(editing.day).padStart(2,'0')
    const scheduleDate = `${year}-${pad}-${dd}`

    const payload = {
      employeeId: editing.empId,
      scheduleDate,
      shiftTypeId:  null,
      isRestDay:    false,
      absenceType:  null,
    }

    if (type === 'shift') {
      payload.shiftTypeId = value.id
    } else if (value === 'descanso') {
      payload.isRestDay = true
    } else {
      payload.absenceType = value
    }

    await schedApi.upsert(payload)

    const key = `${editing.empId}_${editing.day}`
    setSchedMap(prev => ({
      ...prev,
      [key]: {
        shiftTypeId: payload.shiftTypeId,
        code:        type === 'shift' ? value.code  : null,
        color:       type === 'shift' ? value.color : null,
        isRestDay:   payload.isRestDay,
        absenceType: payload.absenceType,
      }
    }))
  }

  async function handleClear() {
    const key   = `${editing.empId}_${editing.day}`
    const entry = schedMap[key]
    if (entry?.id) await schedApi.remove(entry.id)
    setSchedMap(prev => { const n = {...prev}; delete n[key]; return n })
  }

  const editEntry = editing ? schedMap[`${editing.empId}_${editing.day}`] : null

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Nómina</p>
          <h1 className="text-2xl font-semibold text-gray-800">Programación de turnos</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {groups.length > 0 && (
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none focus:border-indigo-500 transition-all">
              <option value="">Todos los grupos</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent text-gray-600 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-medium text-gray-700 px-2 min-w-28 text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent text-gray-600 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      {shiftTypesList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {shiftTypesList.filter(st => st.active).map(st => (
            <div key={st.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: hexToRgba(st.color || '#3B82F6', 0.12), color: st.color || '#3B82F6' }}>
              <span className="font-bold">{st.code}</span>
              <span className="text-gray-500 font-normal">{st.name}</span>
            </div>
          ))}
          {absenceTypesList.map(ab => (
            <div key={ab.value} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: hexToRgba(ab.color, 0.1), color: ab.color }}>
              {ab.label}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Cargando programación...</div>
        ) : employees.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">No hay empleados activos</div>
        ) : (
          <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
            <table className="border-collapse" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-100 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-48">
                    Empleado
                  </th>
                  {days.map(d => {
                    const { label, isSun } = dayLabel(year, month, d)
                    return (
                      <th key={d} className="border-b border-gray-100 text-center text-xs font-medium min-w-10 w-10"
                        style={{ color: isSun ? '#EF4444' : '#6B7280', padding: '6px 2px' }}>
                        <div className="text-gray-400 text-[10px] font-normal">{label}</div>
                        <div>{d}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleEmps.map((emp, i) => (
                  <tr key={emp.id} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                    <td className="sticky left-0 z-10 border-b border-r border-gray-100 px-4 py-2.5"
                      style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <p className="font-medium text-gray-800 text-sm leading-tight">{emp.name}</p>
                      <p className="text-gray-400 text-xs truncate max-w-40">{emp.position}{emp.group ? ` · ${emp.group}` : ''}</p>
                    </td>
                    {days.map(d => {
                      const { isSun } = dayLabel(year, month, d)
                      const entry = schedMap[`${emp.id}_${d}`]
                      const bg    = CellBg({ entry, absenceTypes: absenceTypesList })
                      return (
                        <td key={d} className="border-b border-gray-100 p-0.5 text-center"
                          style={{ background: isSun ? '#FEF2F2' : undefined }}>
                          <div
                            onClick={() => openEdit(emp, d)}
                            className="flex items-center justify-center rounded cursor-pointer transition-all hover:opacity-75 hover:ring-1 hover:ring-indigo-400 select-none"
                            style={{ background: bg, width: 34, height: 34, margin: '0 auto' }}>
                            <CellContent entry={entry} absenceTypes={absenceTypesList} />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EditModal
          empName={editing.empName}
          day={editing.day} month={month} year={year}
          entry={editEntry}
          shiftTypesList={shiftTypesList}
          absenceTypes={absenceTypesList}
          onSave={handleSave}
          onClear={handleClear}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
