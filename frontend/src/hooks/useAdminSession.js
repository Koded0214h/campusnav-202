import { useCallback, useState } from 'react'
import { getAdminSession, adminLogout as apiLogout } from '../api/campusnav'

export function useAdminSession() {
  const [session, setSession] = useState(() => getAdminSession())

  const refresh = useCallback(() => setSession(getAdminSession()), [])

  const logout = useCallback(() => {
    apiLogout()
    setSession(null)
  }, [])

  return { session, refresh, logout, isAuthenticated: Boolean(session) }
}
