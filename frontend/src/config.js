// Base URL of the CampusNav Spring Boot API (PRD 6.3). Defaults to the
// local `mvn spring-boot:run` port so `npm run dev` works out of the box;
// override via .env.local for a deployed backend (e.g. Render).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// GPS fallback when location is denied/unavailable — kept distinct from
// every seeded building/POI so a route request never has an identical
// start and end point (which some routing APIs return degenerate paths
// for). Roughly the middle of the UNILAG pilot zone.
export const CAMPUS_CENTER = { lat: 6.5178, lng: 3.3958 }
