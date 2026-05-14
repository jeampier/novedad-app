import { useEffect, useState } from 'react'
import { employees as api } from '../../api/payroll'
import { shiftTypes as shiftTypesApi } from '../../api/payroll'

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
const sel = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 bg-white transition-all cursor-pointer"

const DOC_TYPES = [
  { value: 'CC',  label: 'CC — Cédula de Ciudadanía' },
  { value: 'CE',  label: 'CE — Cédula de Extranjería' },
  { value: 'PAS', label: 'PAS — Pasaporte' },
  { value: 'TI',  label: 'TI — Tarjeta de Identidad' },
  { value: 'NIT', label: 'NIT' },
]

const EMPTY = {
  firstName: '', lastName: '', documentType: 'CC', document: '',
  position: '', area: '', groupName: '', shiftTypeId: '',
  startDate: '', baseSalary: '', smmlv: '', phone: '', email: '',
}

function initials(emp) {
  return [(emp.first_name || emp.name || '')[0], (emp.last_name || '')[0]]
    .filter(Boolean).join('').toUpperCase()
}

function fmtSalary(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

function Modal({ title, wide, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-2xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {status === 'active' ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export default function EmployeesPage() {
  const [list,       setList]       = useState([])
  const [shiftTypes, setShiftTypes] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState(null)   // null | 'create' | emp (edit)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.list(), shiftTypesApi.list().catch(() => [])])
      .then(([emps, types]) => { setList(emps); setShiftTypes(types) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = list.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.document || '').includes(search) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setForm(EMPTY); setError(''); setModal('create')
  }

  function openEdit(emp) {
    setForm({
      firstName:    emp.first_name  || '',
      lastName:     emp.last_name   || '',
      documentType: emp.document_type || 'CC',
      document:     emp.document    || '',
      position:     emp.position    || '',
      area:         emp.area        || '',
      groupName:    emp.group_name  || '',
      shiftTypeId:  emp.shift_type_id ? String(emp.shift_type_id) : '',
      startDate:    emp.start_date?.slice(0, 10) || '',
      baseSalary:   emp.base_salary || '',
      smmlv:        emp.smmlv       || '',
      phone:        emp.phone       || '',
      email:        emp.email       || '',
    })
    setError(''); setModal(emp)
  }

  async function handleSave() {
    if (!form.firstName) { setError('El nombre es requerido'); return }
    if (!form.document)  { setError('El documento es requerido'); return }
    if (!form.position)  { setError('El cargo es requerido'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        shiftTypeId: form.shiftTypeId ? Number(form.shiftTypeId) : null,
        baseSalary:  form.baseSalary  ? Number(form.baseSalary)  : 0,
        smmlv:       form.smmlv       ? Number(form.smmlv)       : 0,
      }
      if (modal === 'create') await api.create(payload)
      else                    await api.update(modal.id, payload)
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function toggleStatus(emp) {
    const next = emp.status === 'active' ? 'inactive' : 'active'
    await api.setStatus(emp.id, next).catch(() => {})
    load()
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function fld(k)    { return { value: form[k] ?? '', onChange: e => set(k, e.target.value) } }

  const isEdit = modal && modal !== 'create'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Personal</p>
          <h1 className="text-2xl font-semibold text-gray-800">Empleados</h1>
          <p className="text-sm text-gray-400 mt-1">{list.length} empleados activos</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Nuevo empleado
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input className={inp} placeholder="Buscar por nombre, documento o cargo..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm mb-3">No se encontraron empleados</p>
            <button onClick={openCreate}
              className="px-4 py-2 rounded-xl text-white text-sm cursor-pointer border-0"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              Crear primer empleado
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Empleado', 'Documento', 'Cargo', 'Grupo / Área', 'Turno', 'Salario base', 'Contacto', 'Estado', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
                          {initials(emp)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {emp.last_name ? `${emp.last_name}, ${emp.first_name}` : emp.first_name}
                          </p>
                          <p className="text-gray-400 text-xs">{emp.start_date ? `Desde ${new Date(emp.start_date + 'T00:00').toLocaleDateString('es-CO', { month:'short', year:'numeric' })}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-gray-700">{emp.document}</p>
                      <p className="text-xs text-gray-400">{emp.document_type}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{emp.position || '—'}</td>
                    <td className="px-5 py-4">
                      <p className="text-gray-600">{emp.group_name || '—'}</p>
                      <p className="text-gray-400 text-xs">{emp.area || ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      {emp.shift_type_id ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: (emp.shift_color || '#6366f1') + '22', color: emp.shift_color || '#6366f1' }}>
                          {emp.shift_code} · {emp.shift_name}
                        </span>
                      ) : <span className="text-gray-300 text-xs">Sin turno</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{fmtSalary(emp.base_salary)}</td>
                    <td className="px-5 py-4">
                      {emp.phone && <p className="text-xs text-gray-500">{emp.phone}</p>}
                      {emp.email && <p className="text-xs text-gray-400 truncate max-w-[140px]">{emp.email}</p>}
                      {!emp.phone && !emp.email && <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={emp.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(emp)}
                          className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                          Editar
                        </button>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => toggleStatus(emp)}
                          className={`text-xs cursor-pointer bg-transparent border-0 p-0 hover:underline ${emp.status === 'active' ? 'text-red-500' : 'text-green-600'}`}>
                          {emp.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={isEdit ? 'Editar empleado' : 'Nuevo empleado'} wide onClose={() => setModal(null)}>
          <div className="space-y-5">
            {/* Datos personales */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Datos personales</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Nombre *</label>
                  <input className={inp} placeholder="Primer nombre" {...fld('firstName')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Apellido(s)</label>
                  <input className={inp} placeholder="Apellido(s)" {...fld('lastName')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Tipo de documento</label>
                  <select className={sel} {...fld('documentType')}>
                    {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Número de documento *</label>
                  <input className={inp} placeholder="Número" {...fld('document')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Teléfono</label>
                  <input className={inp} placeholder="3XX XXX XXXX" type="tel" {...fld('phone')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
                  <input className={inp} placeholder="correo@empresa.com" type="email" {...fld('email')} />
                </div>
              </div>
            </div>

            {/* Datos laborales */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Datos laborales</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Cargo *</label>
                  <input className={inp} placeholder="Ej: Operario de producción" {...fld('position')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Área</label>
                  <input className={inp} placeholder="Ej: Producción" {...fld('area')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Grupo operativo</label>
                  <input className={inp} placeholder="Ej: Grupo A" {...fld('groupName')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Fecha de ingreso</label>
                  <input className={inp} type="date" {...fld('startDate')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Turno por defecto</label>
                  <select className={sel} {...fld('shiftTypeId')}>
                    <option value="">Sin turno asignado</option>
                    {shiftTypes.filter(t => t.active).map(t => (
                      <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Salario base</label>
                  <input className={inp} type="number" placeholder="0" {...fld('baseSalary')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">SMMLV aplicable</label>
                  <input className={inp} type="number" placeholder="1300000" {...fld('smmlv')} />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer bg-white">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer border-0 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear empleado'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
