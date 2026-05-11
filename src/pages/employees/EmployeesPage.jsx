import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCommand } from '../../hooks/useCommand'
const inp = { padding:'10px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14 }
export default function EmployeesPage() {
  const onboard  = useCommand('OnboardEmployee')
  const offboard = useCommand('OffboardEmployee')
  const [tab, setTab] = useState('onboard')
  const [success, setSuccess] = useState(false)
  const cmd = tab === 'onboard' ? onboard : offboard
  async function handleSubmit(e) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.target))
    try { await cmd.execute(form); setSuccess(true); e.target.reset() } catch {}
  }
  return (
    <div style={{ maxWidth:600, margin:'40px auto', padding:'1rem' }}>
      <Link to="/" style={{ fontSize:13, color:'#888', textDecoration:'none' }}>Volver</Link>
      <h2 style={{ fontSize:20, margin:'1rem 0' }}>Empleados</h2>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['onboard','offboard'].map(t => (
          <button key={t} onClick={() => { setTab(t); setSuccess(false) }}
            style={{ padding:'6px 16px', border:'1px solid #ddd', borderRadius:6, background: tab===t ? '#2d3748' : 'transparent', color: tab===t ? '#fff' : 'inherit', cursor:'pointer', fontSize:13 }}>
            {t === 'onboard' ? 'Ingreso' : 'Retiro'}
          </button>
        ))}
      </div>
      {success     && <p style={{ color:'green', marginBottom:12 }}>Operacion exitosa.</p>}
      {cmd.error   && <p style={{ color:'red',   marginBottom:12 }}>{cmd.error}</p>}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {tab === 'onboard' ? (
          <>
            <input style={inp} name="name"      placeholder="Nombre completo" required />
            <input style={inp} name="document"  placeholder="Documento de identidad" required />
            <input style={inp} name="position"  placeholder="Cargo" required />
            <input style={inp} name="area"      placeholder="Area o departamento" />
            <select style={inp} name="shift">
              <option value="">Turno inicial</option>
              <option value="morning">Manana</option>
              <option value="afternoon">Tarde</option>
              <option value="night">Noche</option>
            </select>
            <input style={inp} name="startDate" type="date" required />
          </>
        ) : (
          <>
            <input style={inp} name="employeeId" placeholder="ID del empleado" required />
            <input style={inp} name="endDate"    type="date" required />
            <textarea style={inp} name="reason"  placeholder="Motivo del retiro" rows={3} />
          </>
        )}
        <button type="submit" disabled={cmd.loading}
          style={{ padding:10, background: tab==='onboard' ? '#276749' : '#c53030', color:'#fff', border:'none', borderRadius:6, fontSize:14, cursor:'pointer' }}>
          {cmd.loading ? 'Procesando...' : (tab === 'onboard' ? 'Registrar ingreso' : 'Registrar retiro')}
        </button>
      </form>
    </div>
  )
}
