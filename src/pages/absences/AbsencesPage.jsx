import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCommand } from '../../hooks/useCommand'
const inp = { padding:'10px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14 }
export default function AbsencesPage() {
  const { execute, loading, error } = useCommand('RegisterAbsence')
  const [success, setSuccess] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.target))
    try { await execute(form); setSuccess(true); e.target.reset() } catch {}
  }
  return (
    <div style={{ maxWidth:600, margin:'40px auto', padding:'1rem' }}>
      <Link to="/" style={{ fontSize:13, color:'#888', textDecoration:'none' }}>Volver</Link>
      <h2 style={{ fontSize:20, margin:'1rem 0' }}>Registrar ausencia</h2>
      {success && <p style={{ color:'green', marginBottom:12 }}>Novedad registrada correctamente.</p>}
      {error   && <p style={{ color:'red',   marginBottom:12 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <input style={inp} name="employeeId" placeholder="ID del empleado" required />
        <select style={inp} name="type" required>
          <option value="">Tipo de ausencia</option>
          <option value="sick">Incapacidad medica</option>
          <option value="personal">Permiso personal</option>
          <option value="vacation">Vacaciones</option>
          <option value="other">Otro</option>
        </select>
        <input style={inp} name="startDate" type="date" required />
        <input style={inp} name="endDate"   type="date" />
        <textarea style={inp} name="reason" placeholder="Motivo (opcional)" rows={3} />
        <button type="submit" disabled={loading}
          style={{ padding:10, background:'#2d3748', color:'#fff', border:'none', borderRadius:6, fontSize:14, cursor:'pointer' }}>
          {loading ? 'Registrando...' : 'Registrar ausencia'}
        </button>
      </form>
    </div>
  )
}
