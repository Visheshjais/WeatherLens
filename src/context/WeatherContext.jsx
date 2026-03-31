/**
 * WeatherContext.jsx
 * ------------------
 * Global React context that stores:
 *   - User's GPS coordinates (latitude, longitude)
 *   - Location name (city, country)
 *   - Loading / error states
 *   - searchLocation() — lets user manually search any city
 *
 * On mount, requests browser GPS. If denied, falls back to New Delhi.
 * User can override at any time via the location search in the Navbar.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

const WeatherContext = createContext(null)

export function WeatherProvider({ children }) {
  const [coords, setCoords]             = useState(null)   // { lat, lon }
  const [locationName, setLocationName] = useState('')     // "New Delhi, India"
  const [geoError, setGeoError]         = useState(null)   // error string
  const [geoLoading, setGeoLoading]     = useState(true)   // fetching GPS?

  // ── Auto GPS detection on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported. Using default: New Delhi.')
      setCoords({ lat: 28.6139, lon: 77.209 })
      setLocationName('New Delhi, India')
      setGeoLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        setCoords({ lat, lon })

        // Reverse-geocode GPS → city name using Nominatim (free, no key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const city =
            data.address?.city    ||
            data.address?.town    ||
            data.address?.village ||
            data.address?.county  ||
            'Unknown'
          const country = data.address?.country || ''
          setLocationName(`${city}, ${country}`)
        } catch {
          setLocationName('Your Location')
        }

        setGeoLoading(false)
      },
      (err) => {
        // GPS denied → silent fallback, show gentle warning
        setGeoError(`GPS access denied. Showing New Delhi. Search a city below.`)
        setCoords({ lat: 28.6139, lon: 77.209 })
        setLocationName('New Delhi, India')
        setGeoLoading(false)
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }, [])

  /**
   * searchLocation
   * --------------
   * Forward-geocodes a city name using the Open-Meteo geocoding API.
   * Returns { success: bool, results: [...] } so the UI can show suggestions.
   *
   * @param {string} query  — city name typed by the user
   */
  const searchLocation = async (query) => {
    if (!query?.trim()) return { success: false, results: [] }

    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
      )
      const data = await res.json()
      const results = (data.results || []).map((r) => ({
        id:      r.id,
        name:    r.name,
        country: r.country,
        admin1:  r.admin1 || '',   // state / province
        lat:     r.latitude,
        lon:     r.longitude,
      }))
      return { success: true, results }
    } catch {
      return { success: false, results: [] }
    }
  }

  /**
   * selectLocation
   * --------------
   * Called when user picks a result from the search dropdown.
   * Updates coords and locationName globally — triggers a re-fetch
   * in all hooks that depend on coords.
   */
  const selectLocation = ({ lat, lon, name, country }) => {
    setCoords({ lat, lon })
    setLocationName(`${name}, ${country}`)
    setGeoError(null)  // clear any previous GPS error
  }

  return (
    <WeatherContext.Provider
      value={{
        coords,
        locationName,
        geoError,
        geoLoading,
        searchLocation,
        selectLocation,
      }}
    >
      {children}
    </WeatherContext.Provider>
  )
}

export function useWeather() {
  return useContext(WeatherContext)
}

