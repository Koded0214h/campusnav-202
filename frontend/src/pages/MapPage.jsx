import { useCallback, useEffect, useRef, useState } from 'react'
import { MapView } from '../components/map/MapView'
import { SearchBar } from '../components/search/SearchBar'
import { DestinationSheet } from '../components/destination/DestinationSheet'
import { PinDropSheet } from '../components/pins/PinDropSheet'
import { Toast } from '../components/layout/Toast'
import { useGeolocation } from '../hooks/useGeolocation'
import { formatDistance, formatDuration } from '../lib/format'
import { haversineMeters } from '../lib/geo'
import {
  getDeviceId,
  getLocation,
  getMapData,
  getPoiDetail,
  getRoute,
  listApprovedPins,
  submitPin,
} from '../api/campusnav'
import './MapPage.css'

export function MapPage() {
  const geo = useGeolocation()
  const [buildings, setBuildings] = useState([])
  const [pois, setPois] = useState([])
  const [communityPins, setCommunityPins] = useState([])
  const [selected, setSelected] = useState(null) // { type, id, lat, lng }
  const [sheetOpen, setSheetOpen] = useState(false)
  const [location, setLocation] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [route, setRoute] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [accessible, setAccessible] = useState(false)
  const [routeSource, setRouteSource] = useState('gps')
  const [navSignal, setNavSignal] = useState(0)
  const [navigating, setNavigating] = useState(false)
  const [remainingMeters, setRemainingMeters] = useState(null)

  const [pinDropOpen, setPinDropOpen] = useState(false)
  const [pinDropCoords, setPinDropCoords] = useState(null)
  const [pinSubmitting, setPinSubmitting] = useState(false)
  const [pinError, setPinError] = useState(null)

  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((message, tone = 'default') => {
    setToast({ message, tone })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    getMapData().then((data) => {
      setBuildings(data.buildings)
      setPois(data.pois)
    })
    listApprovedPins().then(setCommunityPins)
  }, [])

  const ARRIVAL_RADIUS_METERS = 15

  // While navigating, track live distance-to-destination off real GPS
  // updates and auto-end the route on arrival. This is still just a
  // preview + live position, not full turn-by-turn (PRD 3 non-goals).
  useEffect(() => {
    if (!navigating || !selected) return
    const remaining = Math.round(haversineMeters(geo.position, selected))
    setRemainingMeters(remaining)
    if (remaining <= ARRIVAL_RADIUS_METERS) {
      showToast(`You've arrived at ${location?.name ?? 'your destination'}!`, 'success')
      endNavigation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigating, geo.position, selected])

  // Fetches a route to `dest` ({ lat, lng }) using the current geolocation
  // (or the campus-center fallback) as the start.
  async function routeTo(dest, accessibleFlag) {
    setLoadingRoute(true)
    setRouteSource(geo.hasRealFix ? 'gps' : 'manual')
    try {
      const result = await getRoute({
        fromLat: geo.position.lat,
        fromLng: geo.position.lng,
        toLat: dest.lat,
        toLng: dest.lng,
        accessible: accessibleFlag,
      })
      setRoute(result)
    } catch (err) {
      console.error('CampusNav: route request failed', err)
      showToast(`Couldn't get directions: ${err.message}`, 'error')
    } finally {
      setLoadingRoute(false)
    }
  }

  // Any marker tap (building, POI, or community pin) opens the destination
  // sheet AND immediately routes there — one tap, not select-then-Directions.
  function openBuilding(building) {
    const dest = { type: 'building', id: building.id, lat: building.lat, lng: building.lng }
    setSelected(dest)
    setSheetOpen(true)
    setRoute(null)
    setAccessible(false)
    setLoadingDetail(true)
    getLocation(building.id).then((detail) => {
      setLocation(detail)
      setLoadingDetail(false)
    })
    routeTo(dest, false)
  }

  function openPoi(poi) {
    const dest = { type: 'poi', id: poi.id, lat: poi.lat, lng: poi.lng }
    setSelected(dest)
    setSheetOpen(true)
    setRoute(null)
    setAccessible(false)
    setLoadingDetail(true)
    getPoiDetail(poi.id).then((detail) => {
      setLocation(detail)
      setLoadingDetail(false)
    })
    routeTo(dest, false)
  }

  function openCommunityPin(pin) {
    const dest = { type: 'poi', id: pin.id, lat: pin.lat, lng: pin.lng }
    setSelected(dest)
    setSheetOpen(true)
    setRoute(null)
    setAccessible(false)
    setLocation({
      id: pin.id,
      name: pin.suggestedName,
      category: pin.suggestedCategory ?? 'community',
      description: pin.note,
      aliases: pin.aliasText ? [pin.aliasText] : [],
      floors: [],
      pois: [],
    })
    setLoadingDetail(false)
    routeTo(dest, false)
  }

  function handleSearchSelect(result) {
    if (result.type === 'building') {
      openBuilding(buildings.find((b) => b.id === result.id))
    } else {
      openPoi(pois.find((p) => p.id === result.id))
    }
  }

  function handleGetDirections() {
    if (!selected) return
    routeTo(selected, accessible)
  }

  function handleToggleAccessible(next) {
    setAccessible(next)
    if (!route || !selected) return
    routeTo(selected, next)
  }

  function handleStart() {
    setNavSignal((n) => n + 1)
    setNavigating(true)
    geo.startWatch()
  }

  function endNavigation() {
    geo.stopWatch()
    setNavigating(false)
    setRemainingMeters(null)
  }

  // Closing the sheet only hides it — the route (if any) stays drawn on the
  // map and a mini route bar takes over so directions don't vanish just
  // because the card was swiped away.
  function closeSheet() {
    setSheetOpen(false)
  }

  function clearRoute() {
    endNavigation()
    setSelected(null)
    setLocation(null)
    setRoute(null)
    setAccessible(false)
    setSheetOpen(false)
  }

  function handleLongPress(coords) {
    setPinDropCoords(coords)
    setPinError(null)
    setPinDropOpen(true)
  }

  async function handlePinSubmit(form) {
    setPinSubmitting(true)
    setPinError(null)
    try {
      await submitPin({
        lat: pinDropCoords.lat,
        lng: pinDropCoords.lng,
        deviceId: getDeviceId(),
        ...form,
      })
      setPinDropOpen(false)
      showToast('Pin submitted for review — thanks!', 'success')
    } catch (err) {
      setPinError(err.message)
    } finally {
      setPinSubmitting(false)
    }
  }

  return (
    <div className="map-page">
      <MapView
        buildings={buildings}
        pois={pois}
        communityPins={communityPins}
        selected={selected}
        route={route?.path ?? null}
        accessible={accessible}
        navSignal={navSignal}
        navigating={navigating}
        userLocation={geo.hasRealFix ? geo.position : null}
        onSelectBuilding={openBuilding}
        onSelectPoi={openPoi}
        onSelectCommunityPin={openCommunityPin}
        onLongPress={handleLongPress}
      />

      <SearchBar onSelect={handleSearchSelect} />

      <div className="map-fabs">
        <button
          type="button"
          className="fab fab-secondary"
          onClick={geo.request}
          aria-label="Use my location"
          title="Use my location"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {geo.status === 'denied' && (
        <p className="gps-banner">
          Location access denied — long-press the map to drop a start pin instead.
        </p>
      )}

      {route && !sheetOpen && location && (
        <button type="button" className="route-bar" onClick={() => setSheetOpen(true)}>
          <span className={`route-bar-dot${navigating ? ' route-bar-dot-live' : ''}`} aria-hidden="true" />
          <span className="route-bar-text">
            <strong>{location.name}</strong>
            <span>
              {navigating && remainingMeters != null
                ? `${formatDistance(remainingMeters)} to go`
                : `${formatDistance(route.distanceMeters)} · ${formatDuration(route.durationSeconds)}`}
              {accessible ? ' · accessible' : ''}
            </span>
          </span>
          <span
            className="route-bar-close"
            role="button"
            tabIndex={0}
            aria-label="End route"
            onClick={(e) => {
              e.stopPropagation()
              clearRoute()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                clearRoute()
              }
            }}
          >
            ×
          </span>
        </button>
      )}

      <DestinationSheet
        open={sheetOpen}
        onClose={closeSheet}
        location={location}
        loadingDetail={loadingDetail}
        route={route}
        loadingRoute={loadingRoute}
        accessible={accessible}
        onToggleAccessible={handleToggleAccessible}
        onGetDirections={handleGetDirections}
        onStart={handleStart}
        navigating={navigating}
        remainingMeters={remainingMeters}
        onStopNavigating={endNavigation}
        routeSource={routeSource}
      />

      <PinDropSheet
        open={pinDropOpen}
        coords={pinDropCoords}
        onClose={() => setPinDropOpen(false)}
        onSubmit={handlePinSubmit}
        submitting={pinSubmitting}
        error={pinError}
      />

      <Toast toast={toast} />
    </div>
  )
}
