import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCommand } from '../../hooks/useCommand'
const inp = { padding:'10px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14 }
export default function ShiftsPage() {
  const { execute, loading, error } = useCommand('ChangeShift')
  const [success, setSuccess] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.target))
    try { await execute(form); setSuccess(true); e.target.reset() } catch {}
  }
  return (
    <div style={{ maxWidth:600, margin:'40px auto', padding:'1rem' }}>
      <Link to="/" style={{ fontSize:13, color:'#888', textDecoration:'none' }}>Volver</Link>
      <h2 style={{ fontSize:20, margin:'1rem 0' }}>Cambio de turno</h2>
      {success && <p style={{ color:'green', marginBottom:12 }}>Turno actualizado.</p>}
      {error   && <p style={{ color:'red',   marginBottom:12 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <input style={inp} name="employeeId" placeholder="ID del empleado" required />
        <select style={inp} name="newShift" required>
          <option value="">Nuevo turno</option>
          <option value="morning">Manana (6am - 2pm)</option>
          <option value="afternoon">Tarde (2pm - 10pm)</option>
          <option value="night">Noche (10pm - 6am)</option>
        </select>
        <input style={inp} name="effectiveDate" type="date" required />
        <textarea style={inp} name="reason" placeholder="Motivo del cambio" rows={3} />
        <button type="submit" disabled={loading}
          style={{ padding:10, background:'#2d3748', color:'#fff', border:'none', borderRadius:6, fontSize:14, cursor:'pointer' }}>
          {loading ? 'Guardando...' : 'Registrar cambio de turno'}
        </button>
      </form>
    </div>
  )
}
