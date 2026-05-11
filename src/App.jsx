import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage     from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AbsencesPage  from './pages/absences/AbsencesPage'
import AccidentsPage from './pages/accidents/AccidentsPage'
import ShiftsPage    from './pages/shifts/ShiftsPage'
import EmployeesPage from './pages/employees/EmployeesPage'
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/"          element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/absences"  element={<PrivateRoute><AbsencesPage /></PrivateRoute>} />
          <Route path="/accidents" element={<PrivateRoute><AccidentsPage /></PrivateRoute>} />
          <Route path="/shifts"    element={<PrivateRoute><ShiftsPage /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
