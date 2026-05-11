import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
const inp = { display:'block', width:'100%', marginBottom:12, padding:'10px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14, boxSizing:'border-box' }
export default function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch { setError('Credenciales invalidas') }
    finally { setLoading(false) }
  }
  return (
    <div style={{ maxWidth:360, margin:'80px auto', padding:'2rem' }}>
      <h1 style={{ fontSize:22, marginBottom:4 }}>Novedad App</h1>
      <p style={{ color:'#888', fontSize:13, marginBottom:24 }}>Sistema de novedades de empleados</p>
      <form onSubmit={handleSubmit}>
        <input style={inp} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={inp} placeholder="Contrasena" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p style={{ color:'#e53e3e', fontSize:13, marginBottom:8 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width:'100%', padding:10, background:'#2d3748', color:'#fff', border:'none', borderRadius:6, fontSize:14, cursor:'pointer' }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
