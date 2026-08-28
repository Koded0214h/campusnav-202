import { useState } from 'react'
import { BottomSheet } from '../layout/BottomSheet'
import './PinDropSheet.css'

const CATEGORIES = [
  { value: 'landmark', label: 'Landmark' },
  { value: 'meeting-spot', label: 'Meeting spot' },
  { value: 'food', label: 'Food spot' },
  { value: 'other', label: 'Other' },
]

export function PinDropSheet({ open, coords, onClose, onSubmit, submitting, error }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('landmark')
  const [alias, setAlias] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ suggestedName: name, suggestedCategory: category, aliasText: alias || null, note: note || null })
  }

  function handleClose() {
    setName('')
    setCategory('landmark')
    setAlias('')
    setNote('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose} labelledBy="pin-drop-title">
      <h2 id="pin-drop-title">Add a pin</h2>
      <p className="pin-drop-hint">
        Suggest an unlisted spot — a landmark or common meeting place. No account needed; a
        campus moderator reviews it before it appears for everyone.
      </p>
      {coords && (
        <p className="pin-drop-coords">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mama Put Junction"
            maxLength={150}
            required
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Alternate name (optional)</span>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="What else do people call it?"
            maxLength={150}
          />
        </label>

        <label className="field">
          <span>Note (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything that helps a moderator place it"
            rows={3}
            maxLength={280}
          />
        </label>

        {error && <p className="pin-drop-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting || !name.trim()}>
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </BottomSheet>
  )
}
