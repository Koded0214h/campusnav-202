import { useEffect, useState } from 'react'
import {
  adminCreateBuilding,
  adminDeleteBuilding,
  adminListBuildings,
  adminUpdateBuilding,
} from '../../mock/mockApi'
import './AdminBuildingsPage.css'

const EMPTY_FORM = {
  name: '',
  officialCode: '',
  category: 'faculty',
  description: '',
  lat: '',
  lng: '',
  aliases: '',
}

export function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    adminListBuildings().then((res) => {
      setBuildings(res)
      setLoading(false)
    })
  }

  useEffect(load, [])

  function startCreate() {
    setEditingId('new')
    setForm(EMPTY_FORM)
  }

  function startEdit(b) {
    setEditingId(b.id)
    setForm({
      name: b.name,
      officialCode: b.officialCode ?? '',
      category: b.category,
      description: b.description ?? '',
      lat: String(b.lat),
      lng: String(b.lng),
      aliases: (b.aliases ?? []).join(', '),
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      officialCode: form.officialCode.trim() || null,
      category: form.category,
      description: form.description.trim(),
      lat: Number(form.lat),
      lng: Number(form.lng),
      aliases: form.aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    }
    try {
      if (editingId === 'new') {
        await adminCreateBuilding(payload)
      } else {
        await adminUpdateBuilding(editingId, payload)
      }
      cancelEdit()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await adminDeleteBuilding(id)
    load()
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1>Buildings</h1>
        <button type="button" className="btn-approve" onClick={startCreate}>
          + New building
        </button>
      </div>

      {editingId && (
        <form className="building-form" onSubmit={handleSave}>
          <h2>{editingId === 'new' ? 'New building' : 'Edit building'}</h2>
          <div className="building-form-grid">
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Official code</span>
              <input
                value={form.officialCode}
                onChange={(e) => setForm((f) => ({ ...f, officialCode: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
                <option value="hostel">Hostel</option>
                <option value="library">Library</option>
                <option value="recreation">Recreation</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="field">
              <span>Aliases (comma-separated)</span>
              <input
                value={form.aliases}
                onChange={(e) => setForm((f) => ({ ...f, aliases: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Latitude</span>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Longitude</span>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="building-form-actions">
            <button type="button" onClick={cancelEdit} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-approve" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="admin-empty">Loading…</p>}

      <table className="building-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Coordinates</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {buildings.map((b) => (
            <tr key={b.id}>
              <td>
                <strong>{b.name}</strong>
                {b.officialCode && <span className="building-code">{b.officialCode}</span>}
              </td>
              <td>{b.category}</td>
              <td className="building-coords">
                {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
              </td>
              <td className="building-row-actions">
                <button type="button" className="btn-ghost" onClick={() => startEdit(b)}>
                  Edit
                </button>
                <button type="button" className="btn-reject" onClick={() => handleDelete(b.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
