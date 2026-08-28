import './Toast.css'

export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`toast toast-${toast.tone ?? 'default'}`} role="status">
      {toast.message}
    </div>
  )
}
