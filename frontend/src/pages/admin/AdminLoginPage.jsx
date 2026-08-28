import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { adminLogin } from '../../mock/mockApi'
import { useAdminSession } from '../../hooks/useAdminSession'
import './AdminLoginPage.css'

export function AdminLoginPage() {
  const { isAuthenticated, refresh } = useAdminSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/admin/pins" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await adminLogin({ email, password })
      refresh()
      navigate('/admin/pins', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>CampusNav Admin</h1>
        <p className="admin-login-sub">Sign in to review community pins and manage map data.</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="admin-login-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="admin-login-hint">
          Mock credentials: <code>admin@campusnav.app</code> / <code>campusnav123</code>
        </p>
      </form>
    </div>
  )
}
