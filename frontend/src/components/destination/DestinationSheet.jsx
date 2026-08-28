import { BottomSheet } from '../layout/BottomSheet'
import { formatDistance, formatDuration } from '../../lib/format'
import './DestinationSheet.css'

export function DestinationSheet({
  open,
  onClose,
  location,
  loadingDetail,
  route,
  loadingRoute,
  accessible,
  onToggleAccessible,
  onGetDirections,
  onStart,
  navigating,
  remainingMeters,
  onStopNavigating,
  routeSource,
}) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="destination-title">
      {loadingDetail && <p className="sheet-hint">Loading…</p>}

      {!loadingDetail && location && (
        <>
          <div className="dest-header">
            <div>
              <span className={`dest-category cat-${location.category}`}>{location.category}</span>
              <h2 id="destination-title">{location.name}</h2>
            </div>
            <button type="button" className="dest-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          {location.description && <p className="dest-description">{location.description}</p>}

          {location.aliases?.length > 0 && (
            <p className="dest-aliases">
              Also known as: {location.aliases.join(', ')}
            </p>
          )}

          {!route && (
            <button type="button" className="btn-primary" onClick={onGetDirections} disabled={loadingRoute}>
              {loadingRoute ? 'Finding route…' : 'Directions'}
            </button>
          )}

          {route && (
            <div className="route-summary">
              {navigating ? (
                <div className="route-summary-stats">
                  <div>
                    <span className="route-stat-value">
                      {remainingMeters != null ? formatDistance(remainingMeters) : '—'}
                    </span>
                    <span className="route-stat-label">Remaining · live GPS</span>
                  </div>
                </div>
              ) : (
                <div className="route-summary-stats">
                  <div>
                    <span className="route-stat-value">{formatDistance(route.distanceMeters)}</span>
                    <span className="route-stat-label">Distance</span>
                  </div>
                  <div>
                    <span className="route-stat-value">{formatDuration(route.durationSeconds)}</span>
                    <span className="route-stat-label">Est. time</span>
                  </div>
                </div>
              )}
              {routeSource === 'manual' && (
                <p className="route-note">Starting from your dropped pin (GPS unavailable).</p>
              )}

              <label className="accessible-toggle">
                <input
                  type="checkbox"
                  checked={accessible}
                  onChange={(e) => onToggleAccessible(e.target.checked)}
                  disabled={navigating}
                />
                <span className="accessible-toggle-track" aria-hidden="true" />
                <span>Accessible route (avoid stairs)</span>
              </label>
              {loadingRoute && <p className="sheet-hint">Recalculating…</p>}

              {navigating ? (
                <button type="button" className="btn-primary btn-stop" onClick={onStopNavigating}>
                  Stop
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={onStart} disabled={loadingRoute}>
                  Start
                </button>
              )}
            </div>
          )}

          {location.floors?.length > 0 && (
            <div className="dest-floors">
              <h3>Floors</h3>
              <ul>
                {location.floors.map((f) => (
                  <li key={f.id}>
                    <span>Floor {f.floorNumber}</span>
                    {f.accessibilityNotes && <span className="floor-note">{f.accessibilityNotes}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {location.pois?.length > 0 && (
            <div className="dest-pois">
              <h3>Inside this building</h3>
              <ul>
                {location.pois.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  )
}
