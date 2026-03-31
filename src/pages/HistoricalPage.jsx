/**
 * HistoricalPage.jsx
 * ------------------
 * Page 2: Historical Date Range Analysis (max 2 years)
 *
 * Features:
 *   - Start / End date pickers (capped at 2 years apart)
 *   - 5 chart sections:
 *     1. Temperature: Mean, Max, Min (line chart)
 *     2. Sun Cycle: Sunrise + Sunset in IST (line chart)
 *     3. Precipitation: Total (bar chart)
 *     4. Wind: Max Speed + Dominant Direction (combo)
 *     5. Air Quality: PM10 + PM2.5 (line chart)
 */

import React, { useState, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { subYears, subMonths } from 'date-fns'

import { useWeather } from '../context/WeatherContext'
import { useHistoricalWeather } from '../hooks/useHistoricalWeather'
import { toApiDate, clampDateRange, formatIST, degreesToCompass } from '../utils/helpers'

import HistoricalChart from '../components/HistoricalChart'
import LoadingScreen   from '../components/LoadingScreen'
import ErrorBanner     from '../components/ErrorBanner'
import styles          from './HistoricalPage.module.css'

export default function HistoricalPage() {
  const { coords, geoLoading, geoError } = useWeather()

  // Default: last 3 months
  const [startDate, setStartDate] = useState(subMonths(new Date(), 3))
  const [endDate,   setEndDate]   = useState(new Date())

  // Enforce 2-year cap when user changes dates
  const handleStartChange = (d) => {
    if (!d) return
    const clamped = clampDateRange(d, endDate)
    setStartDate(clamped.start)
    setEndDate(clamped.end)
  }

  const handleEndChange = (d) => {
    if (!d) return
    const clamped = clampDateRange(startDate, d)
    setStartDate(clamped.start)
    setEndDate(clamped.end)
  }

  // Fetch historical data
  const { data, loading, error } = useHistoricalWeather(
    coords?.lat,
    coords?.lon,
    toApiDate(startDate),
    toApiDate(endDate),
  )

  // ── Build flat chart data arrays ────────────────────────────────────────

  /**
   * Merge daily weather + PM air quality into a unified array
   * of objects keyed by "date" for Recharts.
   */
  const chartData = useMemo(() => {
    if (!data?.weather?.daily) return []

    const d      = data.weather.daily
    const dates  = d.time || []
    const pmMap  = data.dailyPM || {}

    return dates.map((date, i) => {
      const pm = pmMap[date] || {}

      // Parse sunrise / sunset to a comparable number (minutes since midnight)
      // so Recharts can plot them on a numeric axis
      const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return null
        // timeStr can be "HH:MM" or full ISO "2024-01-15T06:30"
        const t = timeStr.includes('T') ? timeStr.slice(11, 16) : timeStr.slice(0, 5)
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
      }

      return {
        date,
        // Temperature
        tempMean: d.temperature_2m_mean?.[i] !== null ? +Number(d.temperature_2m_mean?.[i]).toFixed(1) : null,
        tempMax:  d.temperature_2m_max?.[i]  !== null ? +Number(d.temperature_2m_max?.[i]).toFixed(1)  : null,
        tempMin:  d.temperature_2m_min?.[i]  !== null ? +Number(d.temperature_2m_min?.[i]).toFixed(1)  : null,

        // Sun (in minutes for charting)
        sunriseMin: parseTimeToMinutes(d.sunrise?.[i]),
        sunsetMin:  parseTimeToMinutes(d.sunset?.[i]),

        // Sun (formatted for tooltip)
        sunriseIST: formatIST(d.sunrise?.[i]),
        sunsetIST:  formatIST(d.sunset?.[i]),

        // Precipitation
        precip: d.precipitation_sum?.[i] !== null ? +Number(d.precipitation_sum?.[i]).toFixed(1) : null,

        // Wind
        windMax: d.wind_speed_10m_max?.[i]          !== null ? +Number(d.wind_speed_10m_max?.[i]).toFixed(1) : null,
        windDir: d.wind_direction_10m_dominant?.[i]  !== null ? degreesToCompass(d.wind_direction_10m_dominant?.[i]) : null,

        // PM
        pm10:  pm.pm10  ?? null,
        pm2_5: pm.pm2_5 ?? null,
      }
    })
  }, [data])

  /**
   * Custom tooltip formatter for sun chart:
   * Show "HH:MM IST" instead of raw minutes.
   */
  const minutesToTime = (mins) => {
    if (mins === null || mins === undefined) return 'N/A'
    const h = Math.floor(mins / 60).toString().padStart(2, '0')
    const m = (mins % 60).toString().padStart(2, '0')
    return `${h}:${m} IST`
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (geoLoading) return <LoadingScreen message="Detecting your location…" />

  return (
    <div className={styles.page}>
      {geoError && <ErrorBanner message={geoError} type="warn" />}
      {error    && <ErrorBanner message={error} />}

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Historical Analysis</h1>
          <p className={styles.pageSubtitle}>Up to 2 years of daily weather trends</p>
        </div>

        {/* Date range pickers */}
        <div className={styles.dateRange}>
          <div className={styles.datepickerWrap}>
            <span className={styles.label}>From</span>
            <DatePicker
              selected={startDate}
              onChange={handleStartChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate}
              minDate={subYears(new Date(), 2)}
              dateFormat="dd MMM yyyy"
              className={styles.datepicker}
            />
          </div>

          <span className={styles.rangeSep}>→</span>

          <div className={styles.datepickerWrap}>
            <span className={styles.label}>To</span>
            <DatePicker
              selected={endDate}
              onChange={handleEndChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              dateFormat="dd MMM yyyy"
              className={styles.datepicker}
            />
          </div>

          {/* Quick range buttons */}
          <div className={styles.quickBtns}>
            {[
              { label: '1M', months: 1 },
              { label: '3M', months: 3 },
              { label: '6M', months: 6 },
              { label: '1Y', months: 12 },
              { label: '2Y', months: 24 },
            ].map(({ label, months }) => (
              <button
                key={label}
                className="btn"
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => {
                  const end   = new Date()
                  const start = subMonths(end, months)
                  setStartDate(start)
                  setEndDate(end)
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && <LoadingScreen message="Loading historical data…" />}

      {/* ── Charts ── */}
      {!loading && chartData.length > 0 && (
        <div className={styles.chartsStack}>

          {/* 1. Temperature */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: 'var(--accent-rose)' }} />
              Temperature (°C)
            </h2>
            <HistoricalChart
              title="Temperature Trends — Mean, Max, Min"
              data={chartData}
              type="line"
              unit="°C"
              lines={[
                { key: 'tempMean', color: 'var(--accent-blue)',   name: 'Mean' },
                { key: 'tempMax',  color: 'var(--accent-rose)',   name: 'Max'  },
                { key: 'tempMin',  color: 'var(--accent-cyan)',   name: 'Min'  },
              ]}
            />
          </section>

          {/* 2. Sun Cycle */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: 'var(--accent-amber)' }} />
              Sun Cycle (IST)
            </h2>
            <HistoricalChart
              title="Sunrise & Sunset (minutes since midnight IST)"
              data={chartData}
              type="line"
              unit="min"
              lines={[
                { key: 'sunriseMin', color: 'var(--accent-amber)', name: 'Sunrise' },
                { key: 'sunsetMin',  color: 'var(--accent-rose)',  name: 'Sunset'  },
              ]}
            />
            <p className={styles.chartNote}>
              Y-axis = minutes since midnight. Hover for exact IST time.
            </p>
          </section>

          {/* 3. Precipitation */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: 'var(--accent-cyan)' }} />
              Precipitation
            </h2>
            <HistoricalChart
              title="Daily Precipitation Total"
              data={chartData}
              type="bar"
              unit="mm"
              lines={[
                { key: 'precip', color: 'var(--accent-cyan)', name: 'Precipitation' },
              ]}
            />
          </section>

          {/* 4. Wind */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: 'var(--accent-green)' }} />
              Wind
            </h2>
            <HistoricalChart
              title="Max Wind Speed (km/h)"
              data={chartData}
              type="line"
              unit="km/h"
              lines={[
                { key: 'windMax', color: 'var(--accent-green)', name: 'Max Wind Speed' },
              ]}
            />
            {/* Wind direction table snippet */}
            <div className={styles.windDirSection}>
              <p className={styles.chartNote}>Dominant Wind Direction (last 30 days shown):</p>
              <div className={styles.windDirGrid}>
                {chartData.slice(-30).map((d) => (
                  <div key={d.date} className={styles.windDirCell}>
                    <span className={styles.windDirDate}>{d.date.slice(5)}</span>
                    <span className={styles.windDirVal}>{d.windDir || '--'}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. Air Quality PM */}
          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.dot} style={{ background: 'var(--accent-violet)' }} />
              Air Quality
            </h2>
            <HistoricalChart
              title="PM10 & PM2.5 Daily Averages"
              data={chartData}
              type="line"
              unit="µg/m³"
              lines={[
                { key: 'pm10',  color: 'var(--accent-amber)',  name: 'PM10'  },
                { key: 'pm2_5', color: 'var(--accent-violet)', name: 'PM2.5' },
              ]}
            />
          </section>
        </div>
      )}

      {/* Empty state */}
      {!loading && chartData.length === 0 && !error && (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📊</p>
          <p className={styles.emptyText}>Select a date range to load historical data.</p>
        </div>
      )}
    </div>
  )
}
