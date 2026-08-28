import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { searchLocations } from '../../mock/mockApi'
import './SearchBar.css'

const CATEGORY_LABEL = {
  faculty: 'Faculty',
  admin: 'Admin',
  hostel: 'Hostel',
  library: 'Library',
  recreation: 'Recreation',
  office: 'Office',
  lab: 'Lab',
  study: 'Study space',
  cafeteria: 'Cafeteria',
  poi: 'POI',
}

export function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)
  const debouncedQuery = useDebouncedValue(query, 250)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    const id = ++requestId.current
    setLoading(true)
    searchLocations(debouncedQuery).then((res) => {
      if (id === requestId.current) {
        setResults(res)
        setLoading(false)
      }
    })
  }, [debouncedQuery])

  function handleSelect(result) {
    setQuery(result.name)
    setOpen(false)
    onSelect(result)
  }

  return (
    <div className="search-wrap">
      <div className="search-bar">
        <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="14" y1="14" x2="18.5" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          inputMode="search"
          placeholder="Search buildings, offices, hostels…"
          value={query}
          aria-label="Search campus locations"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && query.trim() && (
        <ul className="search-results">
          {loading && <li className="search-hint">Searching…</li>}
          {!loading && results.length === 0 && (
            <li className="search-hint">No matches for “{query}”</li>
          )}
          {!loading &&
            results.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <button type="button" onClick={() => handleSelect(r)}>
                  <span className={`search-result-dot dot-${r.type}`} aria-hidden="true" />
                  <span className="search-result-text">
                    <span className="search-result-name">{r.name}</span>
                    {r.matchedAlias && r.matchedAlias !== r.name && (
                      <span className="search-result-alias">matched “{r.matchedAlias}”</span>
                    )}
                  </span>
                  <span className="search-result-category">{CATEGORY_LABEL[r.category] ?? r.category}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
