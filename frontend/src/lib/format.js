export function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

export function formatDuration(s) {
  const mins = Math.round(s / 60)
  return mins < 1 ? '<1 min walk' : `${mins} min walk`
}
