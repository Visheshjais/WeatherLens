/**
 * LoadingScreen.jsx
 * -----------------
 * Full-page loading state shown while GPS or API data is fetching.
 */

import React from 'react'
import styles from './LoadingScreen.module.css'

export default function LoadingScreen({ message = 'Loading weather data…' }) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Animated rings */}
        <div className={styles.rings}>
          <div className={styles.ring} />
          <div className={styles.ring} />
          <div className={styles.ring} />
          <span className={styles.icon}>◈</span>
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  )
}
