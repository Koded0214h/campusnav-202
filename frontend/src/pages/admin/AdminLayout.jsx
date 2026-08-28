import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAdminSession } from '../../hooks/useAdminSession'
import './AdminLayout.css'

export function AdminLayout() {
  const { session, isAuthenticated, logout } = useAdminSession()

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="admin-brand">CampusNav Admin</span>
        <nav className="admin-nav">
          <NavLink to="/admin/pins" className={({ isActive }) => (isActive ? 'active' : '')}>
            Pin queue
          </NavLink>
          <NavLink to="/admin/buildings" className={({ isActive }) => (isActive ? 'active' : '')}>
            Buildings
          </NavLink>
        </nav>
        <div className="admin-account">
          <span>{session.email}</span>
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
