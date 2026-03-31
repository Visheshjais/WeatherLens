/**
 * api.js
 * ------
 * Centralised API layer for the Open-Meteo ecosystem.
 *
 * APIs used:
 *   1. api.open-meteo.com       – weather (forecast + historical)
 *   2. air-quality-api.open-meteo.com – air quality (AQI, PM, gases)
 *
 * Every function returns a plain JS object so components stay clean.
 */

import axios from 'axios'

// Base URLs
const WEATHER_BASE    = 'https://api.open-meteo.com/v1'
const AIR_BASE        = 'https://air-quality-api.open-meteo.com/v1'
const ARCHIVE_BASE    = 'https://archive-api.open-meteo.com/v1'

/**
 * fetchCurrentAndHourly
 * ----------------------
 * Fetches all data needed for Page 1 for a specific date.
 *
 * @param {number} lat   - latitude
 * @param {number} lon   - longitude
 * @param {string} date  - ISO date string "YYYY-MM-DD"
 * @returns {object}     - combined weather + air quality payload
 */
export async function fetchCurrentAndHourly(lat, lon, date) {
  const [weatherRes, airRes] = await Promise.all([
    // ---- Weather API ----
    axios.get(`${WEATHER_BASE}/forecast`, {
      params: {
        latitude:  lat,
        longitude: lon,
        // Daily variables needed for the stat cards
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'sunrise',
          'sunset',
          'uv_index_max',
          'wind_speed_10m_max',
          'precipitation_probability_max',
        ].join(','),
        // Hourly variables for charts
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'precipitation',
          'visibility',
          'wind_speed_10m',
        ].join(','),
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'precipitation',
          'wind_speed_10m',
        ].join(','),
        timezone:    'auto',
        start_date:  date,
        end_date:    date,
        wind_speed_unit: 'kmh',
      },
    }),

    // ---- Air Quality API ----
    axios.get(`${AIR_BASE}/air-quality`, {
      params: {
        latitude:  lat,
        longitude: lon,
        hourly: [
          'pm10',
          'pm2_5',
          'carbon_monoxide',
          'carbon_dioxide',      // CO₂ in µg/m³ — available in Air Quality API
          'nitrogen_dioxide',
          'sulphur_dioxide',
          'european_aqi',        // Air Quality Index (European standard)
        ].join(','),
        start_date: date,
        end_date:   date,
        timezone:   'auto',
      },
    }),
  ])

  return {
    weather: weatherRes.data,
    air:     airRes.data,
  }
}

/**
 * fetchHistorical
 * ---------------
 * Fetches daily historical data for Page 2 date-range analysis.
 * Uses archive-api which goes back to 1940 but we cap at 2 years.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate   - "YYYY-MM-DD"
 */
export async function fetchHistorical(lat, lon, startDate, endDate) {
  const [weatherRes, airRes] = await Promise.all([
    axios.get(`${ARCHIVE_BASE}/archive`, {
      params: {
        latitude:  lat,
        longitude: lon,
        daily: [
          'temperature_2m_mean',
          'temperature_2m_max',
          'temperature_2m_min',
          'sunrise',
          'sunset',
          'precipitation_sum',
          'wind_speed_10m_max',
          'wind_direction_10m_dominant',
        ].join(','),
        start_date: startDate,
        end_date:   endDate,
        timezone:   'auto',
        wind_speed_unit: 'kmh',
      },
    }),

    // Air quality archive
    axios.get(`${AIR_BASE}/air-quality`, {
      params: {
        latitude:  lat,
        longitude: lon,
        hourly: ['pm10', 'pm2_5'].join(','),
        start_date: startDate,
        end_date:   endDate,
        timezone:   'auto',
      },
    }),
  ])

  // Aggregate hourly PM values into daily averages
  const airHourly = airRes.data.hourly
  const dailyPM   = aggregateHourlyToDailyAvg(
    airHourly.time,
    { pm10: airHourly.pm10, pm2_5: airHourly.pm2_5 }
  )

  return {
    weather: weatherRes.data,
    dailyPM,
  }
}

/**
 * aggregateHourlyToDailyAvg
 * --------------------------
 * Converts hourly arrays into a map keyed by date string,
 * averaging all hourly values for that day.
 *
 * @param {string[]} times     - ISO datetime strings
 * @param {object}   variables - { key: number[] }
 * @returns {object}           - { "YYYY-MM-DD": { key: avg } }
 */
function aggregateHourlyToDailyAvg(times, variables) {
  const dailyMap = {}

  times.forEach((t, i) => {
    const day = t.slice(0, 10) // "YYYY-MM-DD"
    if (!dailyMap[day]) {
      dailyMap[day] = {}
      Object.keys(variables).forEach((k) => {
        dailyMap[day][k] = { sum: 0, count: 0 }
      })
    }
    Object.keys(variables).forEach((k) => {
      const v = variables[k][i]
      if (v !== null && v !== undefined) {
        dailyMap[day][k].sum   += v
        dailyMap[day][k].count += 1
      }
    })
  })

  // Convert sums to averages
  const result = {}
  Object.keys(dailyMap).forEach((day) => {
    result[day] = {}
    Object.keys(variables).forEach((k) => {
      const { sum, count } = dailyMap[day][k]
      result[day][k] = count > 0 ? +(sum / count).toFixed(2) : null
    })
  })

  return result
}
