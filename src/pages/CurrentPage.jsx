/**
 * CurrentPage.jsx
 * ---------------
 * Page 1: Current Weather & Hourly Forecast
 *
 * PERFORMANCE STRATEGY (target: <500ms first render):
 *   1. Promise.all() in api.js fetches weather + air quality in parallel
 *   2. Hourly charts are lazy-loaded (React.lazy + Suspense) — they are
 *      below the fold, so they don't block the first paint of stat cards
 *   3. useMemo() on all derived data arrays prevents recomputation
 *   4. AirQualityCard info is hardcoded — zero extra API calls
 *   5. useCurrentWeather hook deduplicates requests via lastKeyRef
 *
 * Sections:
 *   1. Hero banner  — greeting, date, day High/Low, AQI pill
 *   2. Date picker + °C/°F toggle
 *   3. Stat cards   — temperature, atmospheric, sun, wind
 *   4. Air Quality  — 7 flip cards (click to learn)
 *   5. Hourly charts — 6 charts (lazy loaded)
 */

import React, { useState, useMemo, lazy, Suspense } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useWeather }        from '../context/WeatherContext'
import { useCurrentWeather } from '../hooks/useCurrentWeather'
import {
  celsiusToFahrenheit,
  formatTime,
  hourLabel,
  aqiLevel,
  uvLevel,
  toApiDate,
} from '../utils/helpers'

import StatCard       from '../components/StatCard'
import AirQualityCard from '../components/AirQualityCard'  // flip cards — no extra API calls
import LoadingScreen  from '../components/LoadingScreen'
import ErrorBanner    from '../components/ErrorBanner'
import styles         from './CurrentPage.module.css'

/**
 * Lazy-load HourlyChart — it uses Recharts (heavy library).
 * Since charts are below the fold, lazy loading means the stat cards
 * and AQ section render immediately while Recharts loads in the background.
 * This is the biggest single performance win on first load.
 */
const HourlyChart = lazy(() => import('../components/HourlyChart'))

export default function CurrentPage() {
  // Global GPS context — coords for API, locationName for display
  const { coords, locationName, geoLoading, geoError } = useWeather()

  // Selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Temperature unit toggle: "C" | "F"
  const [tempUnit, setTempUnit] = useState('C')

  /**
   * getGreeting
   * -----------
   * Returns a full greeting string based on current hour:
   *   05:00–11:59 → "Good Morning"
   *   12:00–16:59 → "Good Afternoon"
   *   17:00–20:59 → "Good Evening"
   *   21:00–04:59 → "Good Night"
   */
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h >= 5  && h < 12) return 'Good Morning'
    if (h >= 12 && h < 17) return 'Good Afternoon'
    if (h >= 17 && h < 21) return 'Good Evening'
    return 'Good Night'
  }

  // Fetch weather data whenever coords or date changes
  const { data, loading, error } = useCurrentWeather(
    coords?.lat,
    coords?.lon,
    selectedDate,
  )

  // ── Derived values ────────────────────────────────────────────────────────

  /**
   * Extract the daily (single-day) values from the API response.
   * Open-Meteo returns arrays even for single-day queries, so index [0].
   */
  const daily = useMemo(() => {
    if (!data?.weather?.daily) return null
    const d = data.weather.daily
    return {
      tempMax:      d.temperature_2m_max?.[0],
      tempMin:      d.temperature_2m_min?.[0],
      precip:       d.precipitation_sum?.[0],
      sunrise:      d.sunrise?.[0],
      sunset:       d.sunset?.[0],
      uvMax:        d.uv_index_max?.[0],
      windMax:      d.wind_speed_10m_max?.[0],
      precipProbMax: d.precipitation_probability_max?.[0],
    }
  }, [data])

  /** Current (real-time) observation */
  const current = useMemo(() => {
    if (!data?.weather?.current) return null
    const c = data.weather.current
    return {
      temp:     c.temperature_2m,
      humidity: c.relative_humidity_2m,
      precip:   c.precipitation,
      wind:     c.wind_speed_10m,
    }
  }, [data])

  /** Hourly weather arrays */
  const hourly = useMemo(() => {
    if (!data?.weather?.hourly) return null
    return data.weather.hourly
  }, [data])

  /** Hourly air quality arrays */
  const airHourly = useMemo(() => {
    if (!data?.air?.hourly) return null
    return data.air.hourly
  }, [data])

  /**
   * Build data arrays for Recharts: [{ hour: "14:00", value: 28 }, ...]
   * We filter to only the selected date's 24 hours.
   */
  const buildHourlyDataset = (times, values, key = 'value') => {
    if (!times || !values) return []
    return times.map((t, i) => ({
      hour: hourLabel(t),
      [key]: values[i] !== null ? +Number(values[i]).toFixed(2) : null,
    }))
  }

  // Temperature dataset (apply unit conversion if °F selected)
  const tempData = useMemo(() => {
    if (!hourly) return []
    return buildHourlyDataset(hourly.time, hourly.temperature_2m).map((d) => ({
      ...d,
      value: tempUnit === 'F' ? celsiusToFahrenheit(d.value) : d.value,
    }))
  }, [hourly, tempUnit])

  const humidityData   = useMemo(() => buildHourlyDataset(hourly?.time, hourly?.relative_humidity_2m), [hourly])
  const precipData     = useMemo(() => buildHourlyDataset(hourly?.time, hourly?.precipitation),        [hourly])
  const visibilityData = useMemo(() => {
    // Visibility comes in metres; convert to km for readability
    if (!hourly) return []
    return buildHourlyDataset(hourly.time, hourly.visibility?.map((v) => v !== null ? +(v / 1000).toFixed(2) : null))
  }, [hourly])
  const windData       = useMemo(() => buildHourlyDataset(hourly?.time, hourly?.wind_speed_10m),        [hourly])

  // PM10 + PM2.5 combined dataset (two keys on the same object)
  const pmData = useMemo(() => {
    if (!airHourly) return []
    return (airHourly.time || []).map((t, i) => ({
      hour:  hourLabel(t),
      pm10:  airHourly.pm10?.[i]  !== null ? +Number(airHourly.pm10[i]).toFixed(1)  : null,
      pm2_5: airHourly.pm2_5?.[i] !== null ? +Number(airHourly.pm2_5[i]).toFixed(1) : null,
    }))
  }, [airHourly])

  // Latest AQI value (first non-null in hourly array)
  const latestAqi = useMemo(() => {
    if (!airHourly?.european_aqi) return null
    return airHourly.european_aqi.find((v) => v !== null) ?? null
  }, [airHourly])

  // Latest PM10 / PM2.5
  const latestPm10  = useMemo(() => airHourly?.pm10?.find((v)  => v !== null) ?? null, [airHourly])
  const latestPm25  = useMemo(() => airHourly?.pm2_5?.find((v) => v !== null) ?? null, [airHourly])
  const latestCO    = useMemo(() => airHourly?.carbon_monoxide?.find((v)  => v !== null) ?? null, [airHourly])
  const latestCO2   = useMemo(() => airHourly?.carbon_dioxide?.find((v)   => v !== null) ?? null, [airHourly])
  const latestNO2   = useMemo(() => airHourly?.nitrogen_dioxide?.find((v) => v !== null) ?? null, [airHourly])
  const latestSO2   = useMemo(() => airHourly?.sulphur_dioxide?.find((v)  => v !== null) ?? null, [airHourly])

  const aqiInfo = aqiLevel(latestAqi)
  const uvInfo  = uvLevel(daily?.uvMax)

  // ── Display temperature in selected unit ──────────────────────────────────
  const displayTemp    = (c) => tempUnit === 'F' ? celsiusToFahrenheit(c) : c
  const tempUnitSymbol = tempUnit === 'F' ? '°F' : '°C'

  // ── Render ─────────────────────────────────────────────────────────────────
  if (geoLoading) return <LoadingScreen message="Detecting your location…" />
  if (loading)    return <LoadingScreen message="Fetching weather data…" />

  return (
    <div className={styles.page}>
      {/* Geo warning (non-fatal) */}
      {geoError && <ErrorBanner message={geoError} type="warn" />}
      {error    && <ErrorBanner message={error} />}

      {/* ══════════════════════════════════════════════════════
           HERO BANNER
           ──────────────────────────────────────────────────────
           Shows:
             • Welcome greeting + location name
             • Full date (weekday, day, month, year)
             • Today's forecast HIGH (red) and LOW (cyan)
               — These are the DAY's predicted extremes,
                 NOT the same as the "Current Temp" stat card
                 below (which shows the live real-time reading)
             • AQI pill + UV pill on the right
               — Shown here for at-a-glance overview only;
                 detailed values are in the Air Quality section
         ══════════════════════════════════════════════════════ */}
      {daily && (
        <div className={styles.hero}>

          {/* Left: greeting + date + temp range */}
          <div className={styles.heroLeft}>

            {/* Welcome + location line */}
            <div className={styles.heroGreeting}>
              <span className={styles.heroWave}>👋</span>
              <span>{getGreeting()}, here's the weather for</span>
              <span className={styles.heroLocation}>{locationName || 'your location'}</span>
            </div>

            {/* Full date display */}
            <p className={styles.heroDate}>
              {new Date(selectedDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                day:     'numeric',
                month:   'long',
                year:    'numeric',
              })}
            </p>

            {/* TODAY'S HIGH / LOW forecast range */}
            {/* Note: "Current Temp" card below shows the live now reading */}
            <div className={styles.heroTemp}>
              <div className={styles.heroTempBlock}>
                <span className={styles.heroTempLabel}>Day High</span>
                <div className={styles.heroTempRow}>
                  <span className={styles.heroTempValue} style={{ color: 'var(--accent-rose)' }}>
                    {displayTemp(daily.tempMax)?.toFixed(0)}
                  </span>
                  <span className={styles.heroTempUnit}>{tempUnitSymbol}</span>
                </div>
              </div>

              <div className={styles.heroTempDivider}>/</div>

              <div className={styles.heroTempBlock}>
                <span className={styles.heroTempLabel}>Day Low</span>
                <div className={styles.heroTempRow}>
                  <span
                    className={styles.heroTempValue}
                    style={{ color: 'var(--accent-cyan)', fontSize: 'clamp(34px, 4.5vw, 54px)' }}
                  >
                    {displayTemp(daily.tempMin)?.toFixed(0)}
                  </span>
                  <span className={styles.heroTempUnit}>{tempUnitSymbol}</span>
                </div>
              </div>
            </div>

            {/* Quick info row — wind & rain only (temp/humidity are in cards below) */}
            <div className={styles.heroRange}>
              <span style={{ color: 'var(--accent-green)' }}>
                💨 Max Wind {daily.windMax?.toFixed(0)} km/h
              </span>
              <span className={styles.heroDivider}>·</span>
              <span style={{ color: 'var(--accent-amber)' }}>
                🌧 Rain {daily.precip?.toFixed(1)} mm
              </span>
              <span className={styles.heroDivider}>·</span>
              <span style={{ color: 'var(--accent-amber)' }}>
                🌅 {formatTime(daily.sunrise)} — 🌇 {formatTime(daily.sunset)}
              </span>
            </div>
          </div>

          {/* Right: AQI + UV at-a-glance pills */}
          <div className={styles.heroRight}>
            <div
              className={styles.aqiPill}
              style={{ borderColor: aqiInfo.color, color: aqiInfo.color }}
            >
              <span className={styles.aqiLabel}>AQI</span>
              <span className={styles.aqiValue}>{latestAqi?.toFixed(0) ?? '--'}</span>
              <span className={styles.aqiLevel}>{aqiInfo.label}</span>
            </div>
            <div
              className={styles.uvPill}
              style={{ borderColor: uvInfo.color, color: uvInfo.color }}
            >
              <span>UV {daily.uvMax?.toFixed(1)}</span>
              <span className={styles.uvLevel}>{uvInfo.label}</span>
            </div>
          </div>

        </div>
      )}

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Current Weather</h1>
          <p className={styles.pageSubtitle}>
            Real-time conditions & hourly breakdown
          </p>
        </div>

        {/* Date picker + Temp unit toggle */}
        <div className={styles.controls}>
          {/* Temperature unit toggle */}
          <div className={styles.unitToggle}>
            <button
              className={`${styles.unitBtn} ${tempUnit === 'C' ? styles.unitActive : ''}`}
              onClick={() => setTempUnit('C')}
            >
              °C
            </button>
            <button
              className={`${styles.unitBtn} ${tempUnit === 'F' ? styles.unitActive : ''}`}
              onClick={() => setTempUnit('F')}
            >
              °F
            </button>
          </div>

          {/* Date selector */}
          <div className={styles.datepickerWrap}>
            <span className={styles.calIcon}>📅</span>
            <DatePicker
              selected={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              maxDate={new Date()}
              dateFormat="dd MMM yyyy"
              className={styles.datepicker}
              popperPlacement="bottom-end"
            />
          </div>
        </div>
      </div>

      {/* ── Section 1: Core Weather Variables ── */}
      <section>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-blue)' }} />
          Temperature
        </h2>
        <div className={styles.grid3}>
          <div className="stagger-1"><StatCard icon="🌡" label="Current Temp"  value={displayTemp(current?.temp)?.toFixed(1)}    unit={tempUnitSymbol} accent="var(--accent-blue)"  /></div>
          <div className="stagger-2"><StatCard icon="⬆"  label="Max Temp"      value={displayTemp(daily?.tempMax)?.toFixed(1)}  unit={tempUnitSymbol} accent="var(--accent-rose)"  /></div>
          <div className="stagger-3"><StatCard icon="⬇"  label="Min Temp"      value={displayTemp(daily?.tempMin)?.toFixed(1)}  unit={tempUnitSymbol} accent="var(--accent-cyan)"  /></div>
        </div>
      </section>

      {/* ── Section 2: Atmospheric Conditions ── */}
      <section>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-cyan)' }} />
          Atmospheric Conditions
        </h2>
        <div className={styles.grid3}>
          <div className="stagger-1"><StatCard icon="🌧" label="Precipitation"  value={daily?.precip?.toFixed(1)}   unit="mm"  accent="var(--accent-cyan)"   /></div>
          <div className="stagger-2"><StatCard icon="💧" label="Rel. Humidity"  value={current?.humidity}            unit="%"   accent="var(--accent-blue)"   /></div>
          <div className="stagger-3"><StatCard icon="☀"  label="UV Index"       value={daily?.uvMax?.toFixed(1)}     unit=""    accent={uvInfo.color} sub={uvInfo.label} /></div>
        </div>
      </section>

      {/* ── Section 3: Sun Cycle ── */}
      <section>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-amber)' }} />
          Sun Cycle
        </h2>
        <div className={styles.grid2}>
          <StatCard icon="🌅" label="Sunrise" value={formatTime(daily?.sunrise)} unit="" accent="var(--accent-amber)" />
          <StatCard icon="🌇" label="Sunset"  value={formatTime(daily?.sunset)}  unit="" accent="var(--accent-rose)"  />
        </div>
      </section>

      {/* ── Section 4: Wind & Air ── */}
      <section>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-green)' }} />
          Wind & Air
        </h2>
        <div className={styles.grid2}>
          <StatCard icon="💨" label="Max Wind Speed"       value={daily?.windMax?.toFixed(1)}      unit="km/h" accent="var(--accent-green)"  />
          <StatCard icon="🌂" label="Precip. Probability"  value={daily?.precipProbMax}             unit="%"    accent="var(--accent-violet)" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           SECTION 5: AIR QUALITY METRICS
           ──────────────────────────────────────────────────────
           Each card uses AirQualityCard — a flip card component:
             FRONT: icon + "Full Name (Formula)" + live value + level badge
             BACK:  what it is + colour-coded range guide + health tip
           Click any card to flip it and learn about that pollutant.
           Pure CSS 3D flip — zero extra API calls, no performance cost.
         ══════════════════════════════════════════════════════ */}
      <section>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-violet)' }} />
          Air Quality Metrics
          <span className={styles.sectionHint}>— tap any card to learn more</span>
        </h2>

        {/* Row 1: AQI, PM10, PM2.5, CO */}
        <div className={styles.grid4}>
          <AirQualityCard metricKey="aqi"  value={latestAqi}  accent="var(--accent-violet)" />
          <AirQualityCard metricKey="pm10" value={latestPm10} accent="var(--accent-violet)" />
          <AirQualityCard metricKey="pm25" value={latestPm25} accent="var(--accent-rose)"   />
          <AirQualityCard metricKey="co"   value={latestCO}   accent="var(--accent-amber)"  />
        </div>

        {/* Row 2: CO₂, NO₂, SO₂ */}
        <div className={styles.grid3} style={{ marginTop: 12 }}>
          <AirQualityCard metricKey="co2" value={latestCO2} accent="var(--accent-green)"  />
          <AirQualityCard metricKey="no2" value={latestNO2} accent="var(--accent-rose)"   />
          <AirQualityCard metricKey="so2" value={latestSO2} accent="var(--accent-amber)"  />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           SECTION 6: HOURLY CHARTS
           ──────────────────────────────────────────────────────
           HourlyChart is lazy-loaded (React.lazy) because Recharts
           is a large library. Suspense shows a spinner while it loads.
           This means stat cards and AQ section render instantly,
           and charts appear a moment later — well within 500ms total.
         ══════════════════════════════════════════════════════ */}
      <section>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-blue)' }} />
          Hourly Forecast Charts
        </h2>

        {/* Suspense fallback shown while Recharts bundle loads */}
        <Suspense fallback={
          <div className={styles.chartsFallback}>
            <div className={styles.chartsGrid}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`card ${styles.chartSkeleton}`}>
                  <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 180 }} />
                </div>
              ))}
            </div>
          </div>
        }>
          <div className={styles.chartsGrid}>
          {/* 1. Temperature */}
          <HourlyChart
            title={`Temperature (${tempUnitSymbol})`}
            data={tempData}
            color="var(--accent-rose)"
            unit={tempUnitSymbol}
          />

          {/* 2. Relative Humidity */}
          <HourlyChart
            title="Relative Humidity"
            data={humidityData}
            color="var(--accent-blue)"
            unit="%"
          />

          {/* 3. Precipitation */}
          <HourlyChart
            title="Precipitation"
            data={precipData}
            color="var(--accent-cyan)"
            unit="mm"
          />

          {/* 4. Visibility */}
          <HourlyChart
            title="Visibility"
            data={visibilityData}
            color="var(--accent-violet)"
            unit="km"
          />

          {/* 5. Wind Speed */}
          <HourlyChart
            title="Wind Speed (10m)"
            data={windData}
            color="var(--accent-green)"
            unit="km/h"
          />

          {/* 6. PM10 + PM2.5 combined */}
          <HourlyChart
            title="PM10 & PM2.5"
            data={pmData}
            unit="µg/m³"
            lines={[
              { key: 'pm10',  color: 'var(--accent-amber)',  name: 'PM10'  },
              { key: 'pm2_5', color: 'var(--accent-violet)', name: 'PM2.5' },
            ]}
          />
        </div>{/* end chartsGrid */}
        </Suspense>
      </section>
    </div>
  )
}
