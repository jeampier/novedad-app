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
import ConceptsPage    from './pages/payroll/concepts/ConceptsPage'
import SchedulePage    from './pages/payroll/SchedulePage'
import ShiftTypesPage  from './pages/payroll/ShiftTypesPage'
import PeriodsPage     from './pages/payroll/PeriodsPage'
import RecordsPage          from './pages/payroll/RecordsPage'
import PayrollSettingsPage  from './pages/payroll/PayrollSettingsPage'
import AbsenceTypesPage          from './pages/payroll/AbsenceTypesPage'
import PayrollRateRulesPage      from './pages/payroll/PayrollRateRulesPage'
import EmployeeHistoryPage       from './pages/payroll/EmployeeHistoryPage'
import RequestsPage              from './pages/requests/RequestsPage'
import PeriodScheduleGridPage    from './pages/payroll/PeriodScheduleGridPage'

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
          <Route path="/login"                element={<LoginPage />} />
          <Route path="/"                     element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/requests"             element={<PrivateRoute><RequestsPage /></PrivateRoute>} />
          <Route path="/absences"             element={<PrivateRoute><AbsencesPage /></PrivateRoute>} />
          <Route path="/accidents"            element={<PrivateRoute><AccidentsPage /></PrivateRoute>} />
          <Route path="/shifts"               element={<PrivateRoute><ShiftsPage /></PrivateRoute>} />
          <Route path="/employees"            element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
          <Route path="/payroll/concepts"     element={<PrivateRoute><ConceptsPage /></PrivateRoute>} />
          <Route path="/payroll/schedule"     element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
          <Route path="/payroll/shift-types"  element={<PrivateRoute><ShiftTypesPage /></PrivateRoute>} />
          <Route path="/payroll/periods"      element={<PrivateRoute><PeriodsPage /></PrivateRoute>} />
          <Route path="/payroll/records"       element={<PrivateRoute><RecordsPage /></PrivateRoute>} />
          <Route path="/payroll/settings"       element={<PrivateRoute><PayrollSettingsPage /></PrivateRoute>} />
          <Route path="/payroll/absence-types" element={<PrivateRoute><AbsenceTypesPage /></PrivateRoute>} />
          <Route path="/payroll/rate-rules"       element={<PrivateRoute><PayrollRateRulesPage /></PrivateRoute>} />
          <Route path="/payroll/employee-history" element={<PrivateRoute><EmployeeHistoryPage /></PrivateRoute>} />
          <Route path="/payroll/periods/:id/schedule" element={<PrivateRoute><PeriodScheduleGridPage /></PrivateRoute>} />
          <Route path="/admin"                element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/users"          element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/admin/roles"          element={<AdminRoute><RolesPage /></AdminRoute>} />
          <Route path="/admin/audit"          element={<AdminRoute><AuditPage /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
