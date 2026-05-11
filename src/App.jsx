import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout          from './components/Layout'
import LoginPage       from './pages/LoginPage'
import DashboardPage   from './pages/DashboardPage'
import AbsencesPage    from './pages/absences/AbsencesPage'
import AccidentsPage   from './pages/accidents/AccidentsPage'
import ShiftsPage      from './pages/shifts/ShiftsPage'
import EmployeesPage   from './pages/employees/EmployeesPage'
import AdminPage       from './pages/admin/AdminPage'
import UsersPage       from './pages/admin/UsersPage'
import RolesPage       from './pages/admin/RolesPage'
import AuditPage       from './pages/admin/AuditPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const isAdmin = user.role === 'admin' || user.roles?.includes('admin')
  if (!isAdmin) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/"             element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/absences"     element={<PrivateRoute><AbsencesPage /></PrivateRoute>} />
          <Route path="/accidents"    element={<PrivateRoute><AccidentsPage /></PrivateRoute>} />
          <Route path="/shifts"       element={<PrivateRoute><ShiftsPage /></PrivateRoute>} />
          <Route path="/employees"    element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
          <Route path="/admin"        element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/users"  element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/admin/roles"  element={<AdminRoute><RolesPage /></AdminRoute>} />
          <Route path="/admin/audit"  element={<AdminRoute><AuditPage /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
