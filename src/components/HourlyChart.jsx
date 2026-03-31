/**
 * HourlyChart.jsx
 * ---------------
 * A reusable Recharts-based line chart with:
 *   - Horizontal scroll for dense 24-hr data
 *   - Zoom via Recharts ReferenceArea brush selection
 *   - Responsive container
 *   - Customisable colour, label, unit
 *
 * Props:
 *   - title    : string          — chart heading
 *   - data     : { hour, value }[]  — chart data array
 *   - dataKey  : string          — key for primary line ("value")
 *   - color    : string          — line colour
 *   - unit     : string          — y-axis unit label
 *   - lines    : array (optional)— for multi-series charts (PM10 + PM2.5)
 *     [{ key, color, name }]
 */

import React, { useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceArea, Brush,
} from 'recharts'
import styles from './HourlyChart.module.css'

// Custom tooltip component for a polished look
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipValue}>
          {p.name}: <strong>{p.value !== null ? p.value : 'N/A'}</strong>
          {unit && <span className={styles.tooltipUnit}> {unit}</span>}
        </p>
      ))}
    </div>
  )
}

export default function HourlyChart({ title, data = [], dataKey = 'value', color = '#63b3ed', unit = '', lines }) {
  // Zoom state: tracks mouse-selected ReferenceArea bounds
  const [refAreaLeft, setRefAreaLeft]   = useState('')
  const [refAreaRight, setRefAreaRight] = useState('')
  const [isSelecting, setIsSelecting]   = useState(false)
  const [zoomDomain, setZoomDomain]     = useState(null)  // null = no zoom (show all)

  // On mouse-down inside chart, start zone selection
  const onMouseDown = useCallback((e) => {
    if (e?.activeLabel) {
      setRefAreaLeft(e.activeLabel)
      setIsSelecting(true)
    }
  }, [])

  // Track right boundary while dragging
  const onMouseMove = useCallback((e) => {
    if (isSelecting && e?.activeLabel) {
      setRefAreaRight(e.activeLabel)
    }
  }, [isSelecting])

  // On mouse-up, commit the zoom
  const onMouseUp = useCallback(() => {
    if (!isSelecting || !refAreaLeft || !refAreaRight) {
      setIsSelecting(false)
      return
    }

    // Ensure left < right for the domain
    let [l, r] = [refAreaLeft, refAreaRight].sort()
    setZoomDomain({ left: l, right: r })
    setRefAreaLeft('')
    setRefAreaRight('')
    setIsSelecting(false)
  }, [isSelecting, refAreaLeft, refAreaRight])

  // Reset zoom to full view
  const resetZoom = () => setZoomDomain(null)

  // Filter data based on zoom domain
  const visibleData = zoomDomain
    ? data.filter((d) => d.hour >= zoomDomain.left && d.hour <= zoomDomain.right)
    : data

  // Determine lines to render
  const seriesList = lines || [{ key: dataKey, color, name: title }]

  return (
    <div className={`card ${styles.wrapper}`}>
      {/* Chart header */}
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.headerRight}>
          {unit && <span className={styles.unitBadge}>{unit}</span>}
          {zoomDomain && (
            <button className="btn" onClick={resetZoom} style={{ fontSize: 11, padding: '4px 10px' }}>
              Reset Zoom
            </button>
          )}
        </div>
      </div>

      {/* Hint for zoom */}
      {!zoomDomain && (
        <p className={styles.hint}>Click & drag on chart to zoom in</p>
      )}

      {/* Scrollable chart container */}
      <div className={styles.scrollContainer}>
        {/* 
          We render a fixed-width chart (900px min) inside a scrollable div
          so all 24 hours are visible on mobile via horizontal scroll.
        */}
        <div style={{ minWidth: Math.max(visibleData.length * 38, 600) }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={visibleData}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                interval={seriesList.length > 1 ? 1 : 0}
              />

              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />

              <Tooltip
                content={<CustomTooltip unit={unit} />}
                cursor={{ stroke: 'rgba(99,179,237,0.3)', strokeWidth: 1 }}
              />

              {seriesList.length > 1 && (
                <Legend
                  wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
                />
              )}

              {/* Render one Line per series */}
              {seriesList.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color }}
                  connectNulls
                />
              ))}

              {/* Zoom selection overlay */}
              {isSelecting && refAreaLeft && refAreaRight && (
                <ReferenceArea
                  x1={refAreaLeft}
                  x2={refAreaRight}
                  fill="rgba(99,179,237,0.15)"
                  stroke="var(--accent-blue)"
                  strokeOpacity={0.5}
                />
              )}

              {/* Brush for secondary scrolling within the chart */}
              <Brush
                dataKey="hour"
                height={20}
                stroke="var(--border-accent)"
                fill="var(--bg-panel)"
                travellerWidth={6}
                tickFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
