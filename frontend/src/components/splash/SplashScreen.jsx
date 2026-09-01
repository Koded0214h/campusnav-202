import { useEffect, useState } from 'react'
import './SplashScreen.css'

// Total time the splash stays mounted before the caller can swap it out,
// matched to the CSS animation timeline below (draw → pin drop → wordmark →
// hold → fade). Kept short — this is a brand moment, not a loading gate.
const VISIBLE_MS = 2000

export function SplashScreen({ onFinish }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), VISIBLE_MS)
    const finishTimer = setTimeout(() => onFinish?.(), VISIBLE_MS + 500)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(finishTimer)
    }
  }, [onFinish])

  return (
    <div className={`splash${exiting ? ' splash-exit' : ''}`} role="status" aria-label="Loading CampusNav">
      <svg className="splash-route" viewBox="0 0 240 120" fill="none" aria-hidden="true">
        <circle className="splash-origin" cx="24" cy="96" r="6" />
        <path
          className="splash-path"
          d="M24,96 C 60,30 150,18 216,54"
          stroke="#18a673"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <g className="splash-pin">
          <path
            d="M216 38c-9.9 0-18 8.1-18 18 0 13.5 18 28 18 28s18-14.5 18-28c0-9.9-8.1-18-18-18Z"
            fill="#0b1f33"
          />
          <circle cx="216" cy="56" r="7" fill="#18a673" />
        </g>
      </svg>

      <h1 className="splash-word">CampusNav</h1>
      <p className="splash-tagline">Find your way around UNILAG</p>
    </div>
  )
}
