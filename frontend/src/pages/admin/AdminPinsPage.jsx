import { useEffect, useState } from 'react'
import { adminApprovePin, adminListPins, adminRejectPin } from '../../mock/mockApi'
import './AdminPinsPage.css'

const STATUSES = ['pending', 'approved', 'rejected']

export function AdminPinsPage() {
  const [status, setStatus] = useState('pending')
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [asTypeById, setAsTypeById] = useState({})
  const [reasonById, setReasonById] = useState({})

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

  async function handleApprove(pin) {
    setBusyId(pin.id)
    try {
      await adminApprovePin(pin.id, asTypeById[pin.id] ?? 'poi')
      load()
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(pin) {
    setBusyId(pin.id)
    try {
      await adminRejectPin(pin.id, reasonById[pin.id] ?? 'Not accepted')
      load()
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
        {pins.map((pin) => (
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
                    value={asTypeById[pin.id] ?? 'poi'}
                    onChange={(e) => setAsTypeById((s) => ({ ...s, [pin.id]: e.target.value }))}
                  >
                    <option value="poi">Approve as POI</option>
                    <option value="building">Approve as building</option>
                    <option value="alias">Approve as alias</option>
                  </select>
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
