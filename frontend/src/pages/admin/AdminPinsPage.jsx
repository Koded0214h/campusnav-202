import { useEffect, useState } from 'react'
import { adminApprovePin, adminListBuildings, adminListPins, adminRejectPin } from '../../api/campusnav'
import './AdminPinsPage.css'

const STATUSES = ['pending', 'approved', 'rejected']

export function AdminPinsPage() {
  const [status, setStatus] = useState('pending')
  const [pins, setPins] = useState([])
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [asTypeById, setAsTypeById] = useState({})
  const [targetBuildingById, setTargetBuildingById] = useState({})
  const [floorIdById, setFloorIdById] = useState({})
  const [reasonById, setReasonById] = useState({})
  const [errorById, setErrorById] = useState({})

  function load(nextStatus = status) {
    setLoading(true)
    adminListPins(nextStatus).then((res) => {
      setPins(res)
      setLoading(false)
    })
  }

  useEffect(() => {
    load(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    adminListBuildings().then(setBuildings)
  }, [])

  async function handleApprove(pin) {
    const asType = asTypeById[pin.id] ?? 'poi'
    setBusyId(pin.id)
    setErrorById((s) => ({ ...s, [pin.id]: null }))
    try {
      await adminApprovePin(pin.id, asType, {
        targetBuildingId: targetBuildingById[pin.id] ? Number(targetBuildingById[pin.id]) : null,
        floorId: asType === 'poi' && floorIdById[pin.id] ? Number(floorIdById[pin.id]) : null,
      })
      load()
    } catch (err) {
      setErrorById((s) => ({ ...s, [pin.id]: err.message }))
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(pin) {
    setBusyId(pin.id)
    setErrorById((s) => ({ ...s, [pin.id]: null }))
    try {
      await adminRejectPin(pin.id, reasonById[pin.id] ?? 'Not accepted')
      load()
    } catch (err) {
      setErrorById((s) => ({ ...s, [pin.id]: err.message }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1>Community pin queue</h1>
        <div className="status-tabs">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={s === status ? 'active' : ''}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="admin-empty">Loading…</p>}
      {!loading && pins.length === 0 && <p className="admin-empty">No {status} pins.</p>}

      <ul className="pin-list">
        {pins.map((pin) => {
          const asType = asTypeById[pin.id] ?? 'poi'
          return (
            <li key={pin.id} className="pin-card">
              <div className="pin-card-map" aria-hidden="true">
                <span className="pin-card-dot" />
                <span className="pin-card-coords">
                  {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                </span>
              </div>
              <div className="pin-card-body">
                <div className="pin-card-title">
                  <strong>{pin.suggestedName}</strong>
                  <span className="pin-card-category">{pin.suggestedCategory ?? 'uncategorized'}</span>
                </div>
                {pin.aliasText && <p className="pin-card-meta">Alias: {pin.aliasText}</p>}
                {pin.note && <p className="pin-card-note">“{pin.note}”</p>}
                <p className="pin-card-meta">
                  Submitted {new Date(pin.submittedAt).toLocaleString()} · device {pin.deviceId}
                </p>
                {pin.status === 'rejected' && pin.rejectionReason && (
                  <p className="pin-card-meta pin-card-reason">Rejected: {pin.rejectionReason}</p>
                )}
                {pin.status === 'approved' && (
                  <p className="pin-card-meta">Reviewed by {pin.reviewedBy}</p>
                )}

                {status === 'pending' && (
                  <div className="pin-card-actions">
                    <select
                      value={asType}
                      onChange={(e) => setAsTypeById((s) => ({ ...s, [pin.id]: e.target.value }))}
                    >
                      <option value="poi">Approve as POI</option>
                      <option value="building">Approve as building</option>
                      <option value="alias">Approve as alias</option>
                    </select>

                    {(asType === 'alias' || asType === 'poi') && (
                      <select
                        value={targetBuildingById[pin.id] ?? ''}
                        onChange={(e) =>
                          setTargetBuildingById((s) => ({ ...s, [pin.id]: e.target.value }))
                        }
                      >
                        <option value="">
                          {asType === 'alias' ? 'Select building (required)' : 'Building (optional)'}
                        </option>
                        {buildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {asType === 'poi' && (
                      <input
                        type="number"
                        placeholder="Floor id (optional)"
                        value={floorIdById[pin.id] ?? ''}
                        onChange={(e) => setFloorIdById((s) => ({ ...s, [pin.id]: e.target.value }))}
                      />
                    )}

                    <button
                      type="button"
                      className="btn-approve"
                      disabled={busyId === pin.id}
                      onClick={() => handleApprove(pin)}
                    >
                      Approve
                    </button>
                    <input
                      type="text"
                      placeholder="Rejection reason"
                      value={reasonById[pin.id] ?? ''}
                      onChange={(e) => setReasonById((s) => ({ ...s, [pin.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="btn-reject"
                      disabled={busyId === pin.id}
                      onClick={() => handleReject(pin)}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {errorById[pin.id] && <p className="pin-card-meta pin-card-reason">{errorById[pin.id]}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
