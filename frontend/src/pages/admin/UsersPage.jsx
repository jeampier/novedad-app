import { useEffect, useState } from 'react'
import http from '../../api/client'

const ROLES = ['admin', 'supervisor', 'operator']
const empty = { email: '', full_name: '', role: 'operator', password: '' }

function Badge({ status }) {
  const active = status === 'active'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function RoleBadge({ role }) {
  const colors = { admin: 'bg-indigo-100 text-indigo-700', supervisor: 'bg-blue-100 text-blue-700', operator: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.operator}`}>
      {role}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
const sel = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-indigo-500 bg-white transition-all"

export default function UsersPage() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null) // 'create' | 'edit' | 'password'
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(empty)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = () => {
    setLoading(true)
    http.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setForm(empty); setError(''); setModal('create') }
  function openEdit(u)  { setSelected(u); setForm({ email: u.email, full_name: u.full_name || '', role: u.role, password: '' }); setError(''); setModal('edit') }
  function openPwd(u)   { setSelected(u); setForm({ password: '' }); setError(''); setModal('password') }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      if (modal === 'create') await http.post('/admin/users', form)
      else if (modal === 'edit') await http.put(`/admin/users/${selected.id}`, { full_name: form.full_name, role: form.role, status: selected.status })
      else if (modal === 'password') await http.patch(`/admin/users/${selected.id}/reset-password`, { password: form.password })
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function toggleStatus(u) {
    const action = u.status === 'active' ? 'deactivate' : 'activate'
    await http.patch(`/admin/users/${u.id}/${action}`).catch(() => {})
    load()
  }

  const fld = (k) => ({ value: form[k] || '', onChange: e => setForm(f => ({ ...f, [k]: e.target.value })) })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Administración</p>
          <h1 className="text-2xl font-semibold text-gray-800">Usuarios</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm transition-all hover:opacity-90 cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <input className={inp} placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {['Usuario', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs uppercase">
                          {u.email[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.full_name || '—'}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-4"><Badge status={u.status || 'active'} /></td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {u.last_login ? new Date(u.last_login).toLocaleString('es-CO') : 'Nunca'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)} className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0">Editar</button>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => openPwd(u)} className="text-xs text-gray-500 hover:underline cursor-pointer bg-transparent border-0 p-0">Contraseña</button>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => toggleStatus(u)}
                          className={`text-xs cursor-pointer bg-transparent border-0 p-0 hover:underline ${u.status === 'active' ? 'text-red-500' : 'text-green-600'}`}>
                          {u.status === 'active' ? 'Desactivar' : 'Activar'}
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

      {modal === 'create' && (
        <Modal title="Nuevo usuario" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <input className={inp} placeholder="Nombre completo" {...fld('full_name')} />
            <input className={inp} placeholder="Email" type="email" {...fld('email')} />
            <input className={inp} placeholder="Contraseña (mín. 6 caracteres)" type="password" {...fld('password')} />
            <select className={sel} {...fld('role')}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? 'Guardando...' : 'Crear usuario'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'edit' && (
        <Modal title="Editar usuario" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <input className={inp} placeholder="Nombre completo" {...fld('full_name')} />
            <input className={inp} value={form.email} disabled placeholder="Email" style={{ background: '#f9fafb', color: '#9ca3af' }} />
            <select className={sel} {...fld('role')}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'password' && (
        <Modal title={`Cambiar contraseña — ${selected?.email}`} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <input className={inp} placeholder="Nueva contraseña (mín. 6 caracteres)" type="password" {...fld('password')} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
              {saving ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
