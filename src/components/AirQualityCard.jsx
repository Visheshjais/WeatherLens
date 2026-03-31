/**
 * AirQualityCard.jsx
 * ------------------
 * Air Quality metric card with:
 *
 *  FRONT (always visible):
 *    - Coloured top strip
 *    - Icon + Full Name (Formula)
 *    - Live value + unit
 *    - Colour-coded level badge
 *    - "Click to learn more" hint
 *
 *  ON CLICK → Modal popup (centered overlay):
 *    - Full name + formula
 *    - Brief description
 *    - Colour-coded range guide
 *    - Health tip
 *    - Close button (× or click outside)
 *
 *  HOVER → Subtle 3D tilt effect (CSS perspective transform via mouse position)
 *
 * Why modal instead of in-place flip?
 *   The cards are in a grid — flipping in-place pushes content down and
 *   the back face can go off-screen. A modal always appears centred,
 *   is always fully visible, and works on all screen sizes.
 *
 * Performance:
 *   - All info is hardcoded static data — zero API calls
 *   - Modal rendered in a React Portal (document.body) — no layout shift
 *   - Tilt uses useCallback to avoid re-render on every mouse move
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './AirQualityCard.module.css'

/* ══════════════════════════════════════════════════════════════
   STATIC AIR QUALITY INFO DATABASE
   Hardcoded — instant display, no network request needed.
   ══════════════════════════════════════════════════════════════ */
const AQ_DATA = {
  aqi: {
    icon: '🫁', name: 'Air Quality Index', formula: 'AQI', unit: '',
    brief: 'Overall air quality composite score combining multiple pollutants.',
    ranges: [
      { max: 50,       label: 'Good',          emoji: '😊', color: '#68d391' },
      { max: 100,      label: 'Moderate',       emoji: '😐', color: '#f6e05e' },
      { max: 200,      label: 'Unhealthy',      emoji: '😷', color: '#f6ad55' },
      { max: 300,      label: 'Very Unhealthy', emoji: '⚠️', color: '#fc8181' },
      { max: Infinity, label: 'Hazardous',      emoji: '☠️', color: '#9f7aea' },
    ],
    tip: 'AQI combines multiple pollutants into one easy number. Higher = worse air quality.',
  },
  pm10: {
    icon: '🌫', name: 'Particulate Matter', formula: 'PM₁₀', unit: 'µg/m³',
    brief: 'Coarse dust & pollen particles (≤10 µm diameter).',
    ranges: [
      { max: 50,       label: 'Good',          emoji: '😊', color: '#68d391' },
      { max: 100,      label: 'Moderate',       emoji: '😐', color: '#f6e05e' },
      { max: 250,      label: 'Unhealthy',      emoji: '😷', color: '#f6ad55' },
      { max: Infinity, label: 'Very Unhealthy', emoji: '🔴', color: '#fc8181' },
    ],
    tip: 'PM10 includes dust, pollen and mold spores. Irritates nose, throat and eyes.',
  },
  pm25: {
    icon: '🌫', name: 'Fine Particulate Matter', formula: 'PM₂.₅', unit: 'µg/m³',
    brief: 'Tiny particles (≤2.5 µm) that penetrate deep into lungs.',
    ranges: [
      { max: 12,       label: 'Good',          emoji: '😊', color: '#68d391' },
      { max: 35,       label: 'Moderate',       emoji: '😐', color: '#f6e05e' },
      { max: 55,       label: 'Unhealthy',      emoji: '😷', color: '#f6ad55' },
      { max: Infinity, label: 'Very Unhealthy', emoji: '🔴', color: '#fc8181' },
    ],
    tip: 'PM2.5 is the most dangerous — particles are small enough to enter the bloodstream.',
  },
  co: {
    icon: '🏭', name: 'Carbon Monoxide', formula: 'CO', unit: 'µg/m³',
    brief: 'Poisonous odourless gas from vehicles and fuel burning.',
    ranges: [
      { max: 1000,     label: 'Good',      emoji: '😊', color: '#68d391' },
      { max: 2000,     label: 'Moderate',  emoji: '😐', color: '#f6e05e' },
      { max: 10000,    label: 'Unhealthy', emoji: '😷', color: '#f6ad55' },
      { max: Infinity, label: 'Dangerous', emoji: '☠️', color: '#fc8181' },
    ],
    tip: 'CO is invisible and odourless. High levels cause headaches, dizziness and can be fatal.',
  },
  co2: {
    icon: '🌿', name: 'Carbon Dioxide', formula: 'CO₂', unit: 'µg/m³',
    brief: 'Air freshness & ventilation quality indicator.',
    ranges: [
      { max: 400,      label: 'Excellent', emoji: '👍', color: '#68d391' },
      { max: 800,      label: 'Good',      emoji: '😊', color: '#4fd1c5' },
      { max: 1200,     label: 'Moderate',  emoji: '😐', color: '#f6e05e' },
      { max: 2000,     label: 'Poor',      emoji: '😐', color: '#f6ad55' },
      { max: Infinity, label: 'Very Poor', emoji: '😷', color: '#fc8181' },
    ],
    tip: 'CO₂ rises in poorly ventilated spaces. High levels cause drowsiness and reduced focus.',
  },
  no2: {
    icon: '🔴', name: 'Nitrogen Dioxide', formula: 'NO₂', unit: 'µg/m³',
    brief: 'Traffic & combustion pollution gas.',
    ranges: [
      { max: 40,       label: 'Good',          emoji: '😊', color: '#68d391' },
      { max: 80,       label: 'Moderate',       emoji: '😐', color: '#f6e05e' },
      { max: 180,      label: 'Unhealthy',      emoji: '😷', color: '#f6ad55' },
      { max: Infinity, label: 'Very Unhealthy', emoji: '🔴', color: '#fc8181' },
    ],
    tip: 'NO₂ comes mainly from vehicle engines. It aggravates asthma and causes lung inflammation.',
  },
  so2: {
    icon: '🟡', name: 'Sulphur Dioxide', formula: 'SO₂', unit: 'µg/m³',
    brief: 'Fuel-burning & industrial pollutant.',
    ranges: [
      { max: 40,       label: 'Good',          emoji: '😊', color: '#68d391' },
      { max: 80,       label: 'Moderate',       emoji: '😐', color: '#f6e05e' },
      { max: 380,      label: 'Unhealthy',      emoji: '😷', color: '#f6ad55' },
      { max: Infinity, label: 'Very Unhealthy', emoji: '🔴', color: '#fc8181' },
    ],
    tip: 'SO₂ is produced by burning coal and oil. Causes breathing difficulty and contributes to acid rain.',
  },
}

/**
 * getLevelForValue — finds the matching range for a numeric value
 */
function getLevelForValue(value, ranges) {
  if (value === null || value === undefined) return null
  return ranges.find((r) => value <= r.max) || ranges[ranges.length - 1]
}

/* ══════════════════════════════════════════════════════════════
   INFO MODAL — rendered via React Portal into document.body
   so it's always centred and never clipped by parent containers
   ══════════════════════════════════════════════════════════════ */
function InfoModal({ info, value, level, accent, onClose }) {

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    /*
      Backdrop: full-screen semi-transparent overlay.
      Clicking the backdrop (not the modal itself) closes it.
    */
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${info.name} information`}
    >
      {/* Modal box — stopPropagation prevents backdrop click from firing */}
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ '--modal-accent': accent || level?.color || 'var(--accent-blue)' }}
      >
        {/* Coloured top border */}
        <div className={styles.modalStrip} style={{ background: accent || level?.color || 'var(--accent-blue)' }} />

        {/* Header row */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <span className={styles.modalIcon}>{info.icon}</span>
            <div>
              <h3 className={styles.modalTitle}>{info.name}</h3>
              {/* Formula in accent colour */}
              <p className={styles.modalFormula} style={{ color: accent || 'var(--accent-blue)' }}>
                {info.formula}
              </p>
            </div>
          </div>

          {/* Live value pill */}
          <div className={styles.modalValuePill} style={{ borderColor: level?.color, color: level?.color }}>
            <span className={styles.modalValueNum}>{value?.toFixed(1) ?? '--'}</span>
            {info.unit && <span className={styles.modalValueUnit}>{info.unit}</span>}
          </div>

          {/* Close button */}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Brief description */}
        <p className={styles.modalBrief}>{info.brief}</p>

        {/* Range guide heading */}
        <p className={styles.rangeHeading}>📊 Range Guide</p>

        {/* Colour-coded range rows */}
        <div className={styles.rangeList}>
          {info.ranges.map((r, i) => {
            const prev     = i === 0 ? 0 : info.ranges[i - 1].max + 1
            const rangeStr = r.max === Infinity ? `${prev}+` : `${prev}–${r.max}`
            /* Highlight the row that matches current live value */
            const isActive = level?.label === r.label

            return (
              <div
                key={i}
                className={`${styles.rangeRow} ${isActive ? styles.rangeRowActive : ''}`}
                style={isActive ? { background: `${r.color}18`, borderColor: `${r.color}44` } : {}}
              >
                <span className={styles.rangeDot}  style={{ background: r.color }} />
                <span className={styles.rangeNum}  style={{ color: isActive ? r.color : '' }}>
                  {rangeStr}
                </span>
                <span className={styles.rangeText} style={{ color: r.color }}>
                  {r.emoji} {r.label}
                </span>
                {/* Arrow to show current reading */}
                {isActive && (
                  <span className={styles.rangeNow} style={{ color: r.color }}>← current</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Health tip */}
        <div className={styles.modalTip}>
          <span className={styles.tipIcon}>💡</span>
          <p>{info.tip}</p>
        </div>

        {/* Footer close button */}
        <button className={`btn ${styles.modalCloseBtn}`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body   // render outside the component tree — always fully visible
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN CARD COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function AirQualityCard({ metricKey, value, accent }) {
  const [modalOpen, setModalOpen] = useState(false)  // controls popup visibility
  const [tilt, setTilt]           = useState({ rotX: 0, rotY: 0 })  // 3D tilt state
  const cardRef = useRef(null)

  const info  = AQ_DATA[metricKey]
  if (!info) return null

  const level = getLevelForValue(value, info.ranges)

  /* ── 3D tilt on hover ─────────────────────────────────────────
     Maps cursor position inside card to small X/Y rotation.
     Max ±8°. Uses getBoundingClientRect for precise positioning.
  ───────────────────────────────────────────────────────────── */
  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const rotY =  ((e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2)) * 8
    const rotX = -((e.clientY - rect.top   - rect.height / 2) / (rect.height / 2)) * 8
    setTilt({ rotX, rotY })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotX: 0, rotY: 0 })
  }, [])

  return (
    <>
      {/* ── Card (front face only) ── */}
      <div
        ref={cardRef}
        className={`card ${styles.card}`}
        style={{
          transform: `perspective(800px) rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg)`,
          transition: tilt.rotX === 0 && tilt.rotY === 0
            ? 'transform 0.5s ease, box-shadow 0.3s ease, border-color 0.3s ease'
            : 'transform 0.1s ease',
          cursor: 'pointer',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`${info.name}. Click for details.`}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
      >
        {/* Accent top strip */}
        <div className={styles.topStrip} style={{ background: accent || level?.color || 'var(--accent-blue)' }} />

        <div className={styles.inner}>
          {/* Icon bubble */}
          <div
            className={styles.iconWrap}
            style={{
              background: `${accent || level?.color || 'var(--accent-blue)'}18`,
              color:       accent || level?.color || 'var(--accent-blue)',
              boxShadow:  `0 0 16px ${accent || level?.color || 'var(--accent-blue)'}22`,
            }}
          >
            <span className={styles.icon}>{info.icon}</span>
          </div>

          <div className={styles.content}>
            {/* Full name + (formula) */}
            <p className={styles.label}>
              {info.name}
              <span className={styles.formula}> ({info.formula})</span>
            </p>

            {/* Live value — key= re-triggers animation on change */}
            <div className={styles.valueRow} key={value}>
              <span className={styles.value}>{value?.toFixed(1) ?? '--'}</span>
              {info.unit && <span className={styles.unit}>{info.unit}</span>}
            </div>

            {/* Colour-coded level badge */}
            {level && (
              <span
                className={styles.levelBadge}
                style={{
                  background:  `${level.color}22`,
                  color:        level.color,
                  borderColor: `${level.color}44`,
                }}
              >
                {level.emoji} {level.label}
              </span>
            )}
          </div>
        </div>

        {/* Hint */}
        <p className={styles.hint}>ℹ️ Click for details</p>
      </div>

      {/* ── Modal popup — only rendered when open ── */}
      {modalOpen && (
        <InfoModal
          info={info}
          value={value}
          level={level}
          accent={accent}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
