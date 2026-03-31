/**
 * useHistoricalWeather.js
 * ------------------------
 * Fetches historical weather + PM air quality data for a date range.
 * Enforces the 2-year maximum cap on the range.
 */

import { useState, useEffect, useRef } from 'react'
import { fetchHistorical } from '../utils/api'
import { toApiDate, clampDateRange } from '../utils/helpers'

export function useHistoricalWeather(lat, lon, startDate, endDate) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const lastKeyRef = useRef('')

  useEffect(() => {
    if (!lat || !lon || !startDate || !endDate) return

    // Clamp to max 2 years
    const { start, end } = clampDateRange(new Date(startDate), new Date(endDate))
    const s = toApiDate(start)
    const e = toApiDate(end)

    const key = `${lat}|${lon}|${s}|${e}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchHistorical(lat, lon, s, e)
        setData(result)
      } catch (err) {
        setError(err.message || 'Failed to fetch historical data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [lat, lon, startDate, endDate])

  return { data, loading, error }
}
