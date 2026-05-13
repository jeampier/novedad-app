import { useEffect, useState } from 'react'
import http from '../../api/client'

const MODULES  = ['dashboard', 'employees', 'absences', 'accidents', 'shifts', 'admin']
const ACTIONS  = ['read', 'write', 'edit', 'delete']
const MOD_LABEL = { dashboard: 'Dashboard', employees: 'Empleados', absences: 'Ausencias', accidents: 'Accidentes', shifts: 'Turnos', admin: 'Administración' }
const ACT_LABEL = { read: 'Leer', write: 'Crear', edit: 'Editar', delete: 'Eliminar' }

export default function RolesPage() {
  const [roles, setRoles]             = useState([])
  const [allPerms, setAllPerms]       = useState([])
  const [selected, setSelected]       = useState(null)
  const [checked, setChecked]         = useState(new Set())
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [newRole, setNewRole]         = useState({ name: '', description: '' })
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState('')

  const loadRoles = () =>
    Promise.all([
      http.get('/admin/roles'),
      http.get('/admin/roles/permissions'),
    ]).then(([r, p]) => {
      setRoles(r.data)
      setAllPerms(p.data)
    })

  useEffect(() => { loadRoles() }, [])

  function selectRole(role) {
    setSelected(role)
    setSaved(false)
    setChecked(new Set(role.permissions.map(p => p.id)))
  }

  function toggle(permId) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(permId) ? next.delete(permId) : next.add(permId)
      return next
    })
  }

  async function savePermissions() {
    if (!selected) return
    setSaving(true)
    try {
      await http.put(`/admin/roles/${selected.id}/permissions`, { permissionIds: [...checked] })
      setSaved(true)
      await loadRoles()
    } finally { setSaving(false) }
  }

  async function createRole() {
    if (!newRole.name.trim()) return
    setCreating(true); setCreateError('')
    try {
      await http.post('/admin/roles', newRole)
      setNewRole({ name: '', description: '' })
      setShowNew(false)
      await loadRoles()
    } catch (e) {
      setCreateError(e.response?.data?.error || 'Error al crear rol')
    } finally { setCreating(false) }
  }

  function getPerm(module, action) {
    return allPerms.find(p => p.module === module && p.action === action)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Administración</p>
        <h1 className="text-2xl font-semibold text-gray-800">Roles y Permisos</h1>
        <p className="text-sm text-gray-400 mt-1">Configura qué puede hacer cada rol en el sistema.</p>
      </div>

      <div className="flex gap-6">
        {/* Lista de roles */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</p>
              <button onClick={() => setShowNew(v => !v)}
                className="text-xs text-indigo-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                + Nuevo
              </button>
            </div>
            {showNew && (
              <div className="p-3 border-b border-gray-50 flex flex-col gap-2">
                <input
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-indigo-400"
                  placeholder="Nombre del rol"
                  value={newRole.name}
                  onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-indigo-400"
                  placeholder="Descripción (opcional)"
                  value={newRole.description}
                  onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))}
                />
                {createError && <p className="text-red-500 text-xs">{createError}</p>}
                <button onClick={createRole} disabled={creating}
                  className="w-full py-2 rounded-xl text-white text-xs font-medium cursor-pointer border-0 disabled:opacity-60"
                  style={{ background: '#02005B' }}>
                  {creating ? 'Creando...' : 'Crear rol'}
                </button>
              </div>
            )}
            <div className="divide-y divide-gray-50">
              {roles.map(r => (
                <button key={r.id} onClick={() => selectRole(r)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer border-0 bg-transparent ${selected?.id === r.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                  <p className={`text-sm font-medium ${selected?.id === r.id ? 'text-indigo-700' : 'text-gray-700'}`}>{r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{r.description || 'Sin descripción'}</p>
                  {r.is_system && (
                    <span className="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Sistema</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matriz de permisos */}
        <div className="flex-1">
          {!selected ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-400">Selecciona un rol para ver sus permisos</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{selected.name}</p>
                  <p className="text-xs text-gray-400">{selected.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {saved && <p className="text-xs text-green-600">Cambios guardados ✓</p>}
                  <button onClick={savePermissions} disabled={saving}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium cursor-pointer border-0 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)' }}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Módulo</th>
                      {ACTIONS.map(a => (
                        <th key={a} className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {ACT_LABEL[a]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MODULES.map(mod => (
                      <tr key={mod} className="hover:bg-gray-50/50">
                        <td className="px-5 py-4 font-medium text-gray-700">{MOD_LABEL[mod]}</td>
                        {ACTIONS.map(act => {
                          const perm = getPerm(mod, act)
                          if (!perm) return <td key={act} className="px-5 py-4 text-center"><span className="text-gray-200">—</span></td>
                          return (
                            <td key={act} className="px-5 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={checked.has(perm.id)}
                                onChange={() => toggle(perm.id)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer accent-indigo-600"
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
