import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCommand } from '../../hooks/useCommand'
const inp = { padding:'10px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14 }
export default function AccidentsPage() {
  const { execute, loading, error } = useCommand('RegisterAccident')
  const [success, setSuccess] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.target))
    try { await execute(form); setSuccess(true); e.target.reset() } catch {}
  }
  return (
    <div style={{ maxWidth:600, margin:'40px auto', padding:'1rem' }}>
      <Link to="/" style={{ fontSize:13, color:'#888', textDecoration:'none' }}>Volver</Link>
      <h2 style={{ fontSize:20, margin:'1rem 0' }}>Registrar accidente</h2>
      {success && <p style={{ color:'green', marginBottom:12 }}>Accidente registrado.</p>}
      {error   && <p style={{ color:'red',   marginBottom:12 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <input style={inp} name="employeeId"  placeholder="ID del empleado" required />
        <input style={inp} name="date"        type="date" required />
        <input style={inp} name="location"    placeholder="Lugar del accidente" />
        <select style={inp} name="severity" required>
          <option value="">Severidad</option>
          <option value="low">Leve</option>
          <option value="medium">Moderado</option>
          <option value="high">Grave</option>
        </select>
        <textarea style={inp} name="description" placeholder="Descripcion del accidente" rows={4} required />
        <button type="submit" disabled={loading}
          style={{ padding:10, background:'#c53030', color:'#fff', border:'none', borderRadius:6, fontSize:14, cursor:'pointer' }}>
          {loading ? 'Registrando...' : 'Registrar accidente'}
        </button>
      </form>
    </div>
  )
}
