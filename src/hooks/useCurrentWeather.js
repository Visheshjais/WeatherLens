/**
 * useCurrentWeather.js
 * ---------------------
 * Custom hook that:
 *   1. Accepts lat, lon, and a date string
 *   2. Calls the API utility
 *   3. Returns { data, loading, error }
 *
 * It memoises the fetch so re-renders don't cause extra requests.
 * A new fetch is triggered only when lat/lon/date changes.
 */

import { useState, useEffect, useRef } from 'react'
import { fetchCurrentAndHourly } from '../utils/api'
import { toApiDate } from '../utils/helpers'

export function useCurrentWeather(lat, lon, date) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Use a ref to track the last fetch key so we avoid duplicate requests
  const lastKeyRef = useRef('')

  useEffect(() => {
    // Don't fetch until we have coordinates
    if (!lat || !lon) return

    const dateStr = toApiDate(date || new Date())
    const key     = `${lat}|${lon}|${dateStr}`

    // Skip if nothing changed
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchCurrentAndHourly(lat, lon, dateStr)
        setData(result)
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err.message || 'Failed to fetch weather data.')
        }
      } finally {
        setLoading(false)
      }
    }

    load()

    // Cleanup: cancel in-flight request on unmount / dependency change
    return () => controller.abort()
  }, [lat, lon, date])

  return { data, loading, error }
}
