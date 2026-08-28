import './BottomSheet.css'

export function BottomSheet({ open, onClose, children, labelledBy }) {
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
