/**
 * StatCard.jsx
 * ------------
 * Individual metric display card with:
 *   - Animated value entrance (numberReveal keyframe)
 *   - Accent-coloured top border strip
 *   - Glowing icon bubble
 *   - Hover lift effect (via global .card styles)
 */

import React from 'react'
import styles from './StatCard.module.css'

export default function StatCard({ label, value, unit, icon, accent, sub }) {
  return (
    <div className={`card ${styles.card}`}>
      {/* Coloured top accent strip */}
      <div
        className={styles.topStrip}
        style={{ background: accent || 'var(--accent-blue)' }}
      />

      <div className={styles.inner}>
        {/* Glowing icon bubble */}
        <div
          className={styles.iconWrap}
          style={{
            background: accent ? `${accent}18` : 'rgba(99,179,237,0.1)',
            color: accent || 'var(--accent-blue)',
            boxShadow: accent ? `0 0 16px ${accent}22` : '0 0 16px rgba(99,179,237,0.12)',
          }}
        >
          <span className={styles.icon}>{icon}</span>
        </div>

        <div className={styles.body}>
          {/* Label */}
          <p className={styles.label}>{label}</p>

          {/* Value animates in each time it changes (key trick) */}
          <div className={styles.valueRow} key={value}>
            <span className={styles.value}>{value ?? '--'}</span>
            {unit && <span className={styles.unit}>{unit}</span>}
          </div>

          {/* Optional subtitle e.g. "Good" for AQI */}
          {sub && (
            <p className={styles.sub} style={{ color: accent || 'var(--text-muted)' }}>
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
