/**
 * helpers.js
 * ----------
 * Pure utility functions used throughout the app:
 *   - Temperature conversion (°C ↔ °F)
 *   - Time formatting
 *   - Wind direction degrees → compass label
 *   - AQI level label + color
 *   - UV Index category
 */

/**
 * Converts Celsius to Fahrenheit.
 * Formula: (°C × 9/5) + 32
 */
export const celsiusToFahrenheit = (c) =>
  c !== null && c !== undefined ? +((c * 9) / 5 + 32).toFixed(1) : null

/**
 * Format an ISO datetime string to a readable time like "14:30".
 */
export const formatTime = (isoStr) => {
  if (!isoStr) return '--'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/**
 * Format an ISO datetime string to IST time.
 * All times from Open-Meteo "auto" timezone are already local,
 * but for historical sunrise/sunset we re-label as IST.
 */
export const formatIST = (isoStr) => {
  if (!isoStr) return '--'
  // isoStr may be "HH:MM" already from some endpoints
  if (/^\d{2}:\d{2}$/.test(isoStr)) return isoStr + ' IST'
  const d = new Date(isoStr)
  return (
    d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }) + ' IST'
  )
}

/**
 * Format a "YYYY-MM-DDTHH:mm" string to "HH:mm" for chart labels.
 */
export const hourLabel = (isoStr) => {
  if (!isoStr) return ''
  // isoStr from Open-Meteo: "2024-01-15T14:00"
  return isoStr.slice(11, 16)
}

/**
 * Convert wind direction degrees to compass abbreviation.
 * 0/360 = N, 90 = E, 180 = S, 270 = W
 */
export const degreesToCompass = (deg) => {
  if (deg === null || deg === undefined) return '--'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const idx = Math.round(deg / 22.5) % 16
  return dirs[idx]
}

/**
 * AQI level → label + color
 * Using European AQI scale (0–500)
 */
export const aqiLevel = (aqi) => {
  if (aqi === null || aqi === undefined) return { label: 'N/A', color: '#94a3b8' }
  if (aqi <= 20)  return { label: 'Good',         color: '#68d391' }
  if (aqi <= 40)  return { label: 'Fair',          color: '#90cdf4' }
  if (aqi <= 60)  return { label: 'Moderate',      color: '#f6e05e' }
  if (aqi <= 80)  return { label: 'Poor',          color: '#f6ad55' }
  if (aqi <= 100) return { label: 'Very Poor',     color: '#fc8181' }
  return             { label: 'Extremely Poor',  color: '#9f7aea' }
}

/**
 * UV Index → label + color
 */
export const uvLevel = (uv) => {
  if (uv === null || uv === undefined) return { label: 'N/A', color: '#94a3b8' }
  if (uv <= 2)  return { label: 'Low',       color: '#68d391' }
  if (uv <= 5)  return { label: 'Moderate',  color: '#f6e05e' }
  if (uv <= 7)  return { label: 'High',      color: '#f6ad55' }
  if (uv <= 10) return { label: 'Very High', color: '#fc8181' }
  return             { label: 'Extreme',   color: '#9f7aea' }
}

/**
 * Safely get the first non-null value from an array.
 */
export const firstValid = (arr) =>
  Array.isArray(arr) ? arr.find((v) => v !== null && v !== undefined) ?? null : null

/**
 * Format a date object to "YYYY-MM-DD" for API calls.
 */
export const toApiDate = (date) => {
  const d = new Date(date)
  return d.toISOString().slice(0, 10)
}

/**
 * Clamp a date range to a maximum of 2 years (730 days).
 * Returns { start, end } as Date objects.
 */
export const clampDateRange = (start, end) => {
  const MAX_DAYS = 730
  const diff = (end - start) / (1000 * 60 * 60 * 24)
  if (diff > MAX_DAYS) {
    const newStart = new Date(end)
    newStart.setDate(newStart.getDate() - MAX_DAYS)
    return { start: newStart, end }
  }
  return { start, end }
}
