import { useCallback, useEffect, useRef, useState } from 'react'
import { CAMPUS_CENTER } from '../mock/mockData'

// Wraps the browser Geolocation API with the PRD's manual pin-drop fallback
// (PRD 5.4): if permission is denied or unavailable, callers get `denied`
// back and can let the user drop a pin manually instead.
export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [status, setStatus] = useState('idle') // idle | locating | granted | denied | unsupported
  const [watching, setWatching] = useState(false)
  const watchIdRef = useRef(null)

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      () => {
        setStatus('denied')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  // Live tracking while a route is "started" (PRD v1 is map + route
  // preview, not full turn-by-turn — this just keeps the current-location
  // dot, and the camera following it, in sync with real GPS movement).
  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (watchIdRef.current != null) return
    setWatching(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      () => {
        setStatus('denied')
      },
      { enableHighAccuracy: true, maximumAge: 2000 },
    )
  }, [])

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setWatching(false)
  }, [])

  useEffect(() => stopWatch, [stopWatch])

  const setManualPosition = useCallback((coords) => {
    setPosition(coords)
    setStatus('granted')
  }, [])

  return {
    position: position ?? CAMPUS_CENTER,
    hasRealFix: status === 'granted' && position !== null,
    status,
    watching,
    request,
    startWatch,
    stopWatch,
    setManualPosition,
  }
}
