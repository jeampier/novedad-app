import { useEffect, useState } from 'react'
import { employees as api } from '../../api/payroll'

const EMPTY = { name: '', document: '', position: '', area: '', groupName: '', shift: '', startDate: '', baseSalary: '' }

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
const sel = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 bg-white transition-all"

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
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
  const active = status === 'active'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export default function EmployeesPage() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = () => {
    setLoading(true)
    api.list().then(setList).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = list.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.document || '').includes(search) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setForm(EMPTY); setError(''); setModal('create') }
  function openEdit(emp) {
    setSelected(emp)
    setForm({
      name: emp.name, document: emp.document, position: emp.position || '',
      area: emp.area || '', groupName: emp.group_name || '',
      shift: emp.shift || '', startDate: emp.start_date?.split('T')[0] || '',
      baseSalary: emp.base_salary || ''
    })
    setError(''); setModal('edit')
  }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      if (modal === 'create') {
        await api.create(form)
      } else {
        await api.update(selected.id, form)
      }
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function toggleStatus(emp) {
    const next = emp.status === 'active' ? 'inactive' : 'active'
    await api.setStatus(emp.id, next).catch(() => {})
    load()
  }

  const fld = k => ({ value: form[k] ?? '', onChange: e => setForm(f => ({ ...f, [k]: e.target.value })) })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Personal</p>
          <h1 className="text-2xl font-semibold text-gray-800">Empleados</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm transition-all hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Nuevo empleado
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <input className={inp} placeholder="Buscar por nombre, documento o cargo..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No se encontraron empleados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Empleado', 'Cargo', 'Grupo / Área', 'Salario base', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs uppercase shrink-0">
                          {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-gray-400 text-xs">{emp.document}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{emp.position || '—'}</td>
                    <td className="px-5 py-4">
                      <p className="text-gray-600">{emp.group_name || '—'}</p>
                      <p className="text-gray-400 text-xs">{emp.area || ''}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {emp.base_salary ? `$ ${Number(emp.base_salary).toLocaleString('es-CO')}` : '—'}
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

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Nuevo empleado' : 'Editar empleado'} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Nombre completo *</label>
                <input className={inp} placeholder="Nombre completo" {...fld('name')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Documento *</label>
                <input className={inp} placeholder="Documento" {...fld('document')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha inicio</label>
                <input className={inp} type="date" {...fld('startDate')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Cargo *</label>
                <input className={inp} placeholder="Cargo" {...fld('position')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Área</label>
                <input className={inp} placeholder="Área" {...fld('area')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Grupo</label>
                <input className={inp} placeholder="Grupo operativo" {...fld('groupName')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Turno por defecto</label>
                <input className={inp} placeholder="Código de turno" {...fld('shift')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Salario base</label>
                <input className={inp} type="number" placeholder="0" {...fld('baseSalary')} />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60 mt-1"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? 'Guardando...' : modal === 'create' ? 'Crear empleado' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
