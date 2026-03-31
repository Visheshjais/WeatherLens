/**
 * ErrorBanner.jsx
 * ---------------
 * Inline error / warning banner.
 * Props:
 *   - message : string  — error text
 *   - type    : "error" | "warn"  (default "error")
 */

import React from 'react'
import styles from './ErrorBanner.module.css'

export default function ErrorBanner({ message, type = 'error' }) {
  if (!message) return null
  return (
    <div className={`${styles.banner} ${type === 'warn' ? styles.warn : styles.error}`}>
      <span className={styles.icon}>{type === 'warn' ? '⚠' : '✕'}</span>
      <p className={styles.text}>{message}</p>
    </div>
  )
}
