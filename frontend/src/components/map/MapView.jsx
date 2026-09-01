import mapboxgl from 'mapbox-gl'
import { useEffect, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CAMPUS_CENTER } from '../../config'
import './MapView.css'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const CATEGORY_MARKER = {
  faculty: 'var(--map-poi-official)',
  admin: 'var(--map-poi-official)',
  hostel: 'var(--map-poi-official)',
  library: 'var(--map-poi-official)',
  recreation: 'var(--map-poi-official)',
}

const ROUTE_SOURCE_ID = 'campusnav-route'
const ROUTE_LAYER_ID = 'campusnav-route-line'

function bearingTo([lng1, lat1], [lng2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (d) => (d * 180) / Math.PI
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function MapView({
  buildings,
  pois,
  communityPins,
  selected,
  route,
  accessible,
  userLocation,
  navSignal,
  navigating,
  onSelectBuilding,
  onSelectPoi,
  onSelectCommunityPin,
  onLongPress,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const longPressTimer = useRef(null)
  const styleLoadedRef = useRef(false)

  // callbacks change identity each render; keep the latest without
  // re-running the (expensive) map-init effect.
  const callbacksRef = useRef({})
  callbacksRef.current = { onSelectBuilding, onSelectPoi, onSelectCommunityPin, onLongPress }

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return
    mapboxgl.accessToken = TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [CAMPUS_CENTER.lng, CAMPUS_CENTER.lat],
      zoom: 15.5,
      pitch: 55,
      bearing: -12,
      antialias: true,
    })
    mapRef.current = map

    map.on('load', () => {
      styleLoadedRef.current = true

      // Route source/layers first and unconditionally — this is core
      // functionality and must not be skipped if a decorative layer below
      // throws (e.g. a style that doesn't expose the shape it expects).
      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Casing underneath the colored line keeps the route legible over
      // satellite imagery instead of blending into it.
      map.addLayer({
        id: `${ROUTE_LAYER_ID}-casing`,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 8,
          'line-opacity': 0.9,
        },
      })
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#18a673',
          'line-width': 5,
          'line-opacity': 0.95,
        },
      })

      // 3D building extrusions (PRD 6.1) — best-effort. Wrapped so that if
      // this style's composite source doesn't expose what we expect, it
      // can't take the route layers above down with it.
      try {
        const layers = map.getStyle().layers
        const labelLayerId = layers.find((l) => l.type === 'symbol' && l.layout?.['text-field'])?.id

        map.addLayer(
          {
            id: 'campusnav-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              // Enough opacity to read clearly as solid massing, with a
              // vertical gradient so it still feels like it's sitting on
              // the satellite imagery rather than a flat colored block.
              'fill-extrusion-color': '#dbe4ea',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.75,
              'fill-extrusion-vertical-gradient': true,
            },
          },
          labelLayerId,
        )

        // Crisp footprint edges so buildings read clearly at a glance even
        // where the fill alone might blend into the imagery.
        map.addLayer(
          {
            id: 'campusnav-3d-buildings-outline',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'line',
            minzoom: 14,
            paint: {
              'line-color': '#0b1f33',
              'line-width': 1,
              'line-opacity': 0.25,
            },
          },
          labelLayerId,
        )
      } catch (err) {
        console.warn('CampusNav: 3D building layers unavailable for this style', err)
      }

      map.on('mousedown', startLongPress)
      map.on('touchstart', startLongPress)
      map.on('mouseup', cancelLongPress)
      map.on('touchend', cancelLongPress)
      map.on('drag', cancelLongPress)
    })

    function startLongPress(e) {
      cancelLongPress()
      longPressTimer.current = setTimeout(() => {
        const lngLat = e.lngLat
        callbacksRef.current.onLongPress?.({ lat: lngLat.lat, lng: lngLat.lng })
      }, 550)
    }
    function cancelLongPress() {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }

    return () => {
      cancelLongPress()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // building/poi/community pin markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !TOKEN) return

    function place() {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      buildings.forEach((b) => {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = `map-pin map-pin-building${selected?.type === 'building' && selected.id === b.id ? ' map-pin-selected' : ''}`
        el.setAttribute('aria-label', b.name)
        el.style.setProperty('--pin-color', CATEGORY_MARKER[b.category] ?? 'var(--map-poi-official)')
        el.addEventListener('click', (evt) => {
          evt.stopPropagation()
          callbacksRef.current.onSelectBuilding?.(b)
        })
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([b.lng, b.lat])
          .addTo(map)
        markersRef.current.push(marker)
      })

      pois.forEach((p) => {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'map-pin map-pin-poi'
        el.setAttribute('aria-label', p.name)
        el.addEventListener('click', (evt) => {
          evt.stopPropagation()
          callbacksRef.current.onSelectPoi?.(p)
        })
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.lng, p.lat])
          .addTo(map)
        markersRef.current.push(marker)
      })

      communityPins.forEach((pin) => {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'map-pin map-pin-community'
        el.setAttribute('aria-label', pin.suggestedName)
        el.addEventListener('click', (evt) => {
          evt.stopPropagation()
          callbacksRef.current.onSelectCommunityPin?.(pin)
        })
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map)
        markersRef.current.push(marker)
      })
    }

    if (styleLoadedRef.current) place()
    else map.once('load', place)
  }, [buildings, pois, communityPins, selected])

  // user location marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !TOKEN || !userLocation) return
    if (!userMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'map-pin map-pin-user'
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
    }
    userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]).addTo(map)
  }, [userLocation])

  // Chase-cam: while a route is "started", keep re-centering on each live
  // GPS fix so the camera follows real movement instead of a one-off swoop.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !TOKEN || !navigating || !userLocation) return
    map.easeTo({ center: [userLocation.lng, userLocation.lat], duration: 500, essential: true })
  }, [navigating, userLocation])

  // Draws the route and gives an overview of the whole thing (PRD 6.1:
  // smooth fly-to/tilt on destination select). The closer "about to walk
  // this way" camera only kicks in once Start is pressed, below.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !TOKEN) return

    function apply() {
      const source = map.getSource(ROUTE_SOURCE_ID)
      if (!source) return
      if (route) {
        source.setData({ type: 'Feature', geometry: route, properties: {} })
        map.setPaintProperty(ROUTE_LAYER_ID, 'line-color', accessible ? '#7c3aed' : '#18a673')

        const coords = route.coordinates
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0]),
        )
        map.fitBounds(bounds, { padding: { top: 140, bottom: 220, left: 60, right: 60 }, pitch: 55, duration: 900 })
      } else {
        source.setData({ type: 'FeatureCollection', features: [] })
      }
    }

    if (styleLoadedRef.current) apply()
    else map.once('load', apply)
  }, [route, accessible])

  // Start pressed: swoop in close on the route's start point and point the
  // camera down it — reads as "about to move toward the destination".
  useEffect(() => {
    const map = mapRef.current
    if (!map || !TOKEN || !route || !navSignal) return
    const coords = route.coordinates
    const bearing = bearingTo(coords[0], coords[Math.min(3, coords.length - 1)])
    map.flyTo({
      center: coords[0],
      zoom: 18,
      pitch: 66,
      bearing,
      duration: 1400,
      essential: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navSignal])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !TOKEN || !selected || route) return
    map.flyTo({
      center: [selected.lng, selected.lat],
      zoom: 17.2,
      pitch: 60,
      bearing: -18,
      duration: 1100,
      essential: true,
    })
  }, [selected, route])

  if (!TOKEN) {
    return (
      <div className="map-fallback">
        <p className="map-fallback-title">Map preview unavailable</p>
        <p className="map-fallback-body">
          Set <code>VITE_MAPBOX_TOKEN</code> in <code>frontend/.env.local</code> to render the 3D
          campus map. Search and directions still work below against the mock location data.
        </p>
      </div>
    )
  }

  return <div ref={containerRef} className="map-container" />
}
