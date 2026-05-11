import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const mods = [
  { path:'/employees', label:'Empleados',  desc:'Ingresos y retiros' },
  { path:'/absences',  label:'Ausencias',  desc:'Incapacidades y permisos' },
  { path:'/accidents', label:'Accidentes', desc:'Registro de siniestros' },
  { path:'/shifts',    label:'Turnos',     desc:'Cambios de turno' },
]
export default function DashboardPage() {
  const { user, logout } = useAuth()
  return (
    <div style={{ maxWidth:760, margin:'40px auto', padding:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:22, margin:0 }}>Panel de novedades</h1>
          <p style={{ color:'#888', fontSize:13, margin:0 }}>{user && user.email}</p>
        </div>
        <button onClick={logout} style={{ padding:'6px 14px', border:'1px solid #ddd', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:13 }}>
          Cerrar sesion
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
        {mods.map(m => (
          <Link key={m.path} to={m.path} style={{ display:'block', padding:24, border:'1px solid #e2e8f0', borderRadius:10, textDecoration:'none', color:'inherit' }}>
            <p style={{ fontWeight:500, fontSize:16, margin:'0 0 4px' }}>{m.label}</p>
            <p style={{ color:'#888', fontSize:13, margin:0 }}>{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
