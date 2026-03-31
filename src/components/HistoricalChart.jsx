/**
 * HistoricalChart.jsx
 * -------------------
 * Flexible chart component for Page 2 historical data.
 * Supports:
 *   - Line charts (temperature, PM, wind speed)
 *   - Bar charts (precipitation totals)
 *   - Horizontal scroll for long date ranges
 *   - Zoom via Brush + ReferenceArea click-drag
 *
 * Props:
 *   - title      : string
 *   - data       : array of objects (x-axis key = "date")
 *   - type       : "line" | "bar"  (default "line")
 *   - lines      : [{ key, color, name }]  — series definitions
 *   - unit       : string
 *   - height     : number (default 240)
 */

import React, { useState, useCallback } from 'react'
import {
  LineChart, BarChart,
  Line, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  ReferenceArea, Brush,
} from 'recharts'
import styles from './HistoricalChart.module.css'

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipValue}>
          {p.name}: <strong>{p.value !== null ? (+p.value).toFixed(1) : 'N/A'}</strong>
          {unit && <span className={styles.tooltipUnit}> {unit}</span>}
        </p>
      ))}
    </div>
  )
}

export default function HistoricalChart({
  title,
  data = [],
  type = 'line',
  lines = [],
  unit = '',
  height = 240,
}) {
  // Zoom state
  const [refLeft,  setRefLeft]  = useState('')
  const [refRight, setRefRight] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [zoom, setZoom]         = useState(null)

  const onMouseDown = useCallback((e) => {
    if (e?.activeLabel) { setRefLeft(e.activeLabel); setSelecting(true) }
  }, [])

  const onMouseMove = useCallback((e) => {
    if (selecting && e?.activeLabel) setRefRight(e.activeLabel)
  }, [selecting])

  const onMouseUp = useCallback(() => {
    if (!selecting || !refLeft || !refRight) { setSelecting(false); return }
    const [l, r] = [refLeft, refRight].sort()
    setZoom({ left: l, right: r })
    setRefLeft(''); setRefRight(''); setSelecting(false)
  }, [selecting, refLeft, refRight])

  const visibleData = zoom
    ? data.filter((d) => d.date >= zoom.left && d.date <= zoom.right)
    : data

  // Decide x-axis tick interval based on data length
  const tickInterval = Math.max(1, Math.floor(visibleData.length / 12))

  // Shared chart props
  const sharedProps = {
    data: visibleData,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    margin: { top: 10, right: 16, left: -10, bottom: 0 },
  }

  // Render either LineChart or BarChart
  const ChartComp = type === 'bar' ? BarChart : LineChart

  return (
    <div className={`card ${styles.wrapper}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.headerRight}>
          {unit && <span className={styles.unitBadge}>{unit}</span>}
          {zoom && (
            <button className="btn" onClick={() => setZoom(null)} style={{ fontSize: 11, padding: '4px 10px' }}>
              Reset Zoom
            </button>
          )}
        </div>
      </div>
      <p className={styles.hint}>Click & drag to zoom • Use brush below to scroll</p>

      {/* Scrollable chart */}
      <div className={styles.scrollContainer}>
        <div style={{ minWidth: Math.max(visibleData.length * 24, 600) }}>
          <ResponsiveContainer width="100%" height={height}>
            <ChartComp {...sharedProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: 'rgba(99,179,237,0.2)' }} />
              {lines.length > 1 && (
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              )}

              {/* Series */}
              {lines.map((s) =>
                type === 'bar' ? (
                  <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={12} />
                ) : (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3 }}
                    connectNulls
                  />
                )
              )}

              {/* Zoom selection */}
              {selecting && refLeft && refRight && (
                <ReferenceArea
                  x1={refLeft} x2={refRight}
                  fill="rgba(99,179,237,0.12)"
                  stroke="var(--accent-blue)"
                  strokeOpacity={0.5}
                />
              )}

              {/* Brush for scrolling */}
              <Brush
                dataKey="date"
                height={18}
                stroke="var(--border-accent)"
                fill="var(--bg-panel)"
                travellerWidth={5}
                tickFormatter={() => ''}
              />
            </ChartComp>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
