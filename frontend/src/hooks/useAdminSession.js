import { useCallback, useState } from 'react'
import { getAdminSession, adminLogout as mockLogout } from '../mock/mockApi'

export function useAdminSession() {
  const [session, setSession] = useState(() => getAdminSession())

  const refresh = useCallback(() => setSession(getAdminSession()), [])

  const logout = useCallback(() => {
    mockLogout()
    setSession(null)
  }, [])

  return { session, refresh, logout, isAuthenticated: Boolean(session) }
}
