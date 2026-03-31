/**
 * Navbar.jsx
 * ----------
 * Sticky top navigation bar with 4 key features:
 *
 *  1. Brand logo + app name
 *  2. Page navigation links  (Current | Historical)
 *  3. Location search        — type any city → dropdown of results
 *                              Uses Open-Meteo free Geocoding API
 *                              GPS auto-detect still runs on load;
 *                              this lets user OVERRIDE to any city
 *  4. Theme toggle           — animated pill switch (Dark ↔ Light)
 *                              Persists preference in localStorage
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { useWeather } from '../context/WeatherContext'
import { useTheme }   from '../context/ThemeContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  // ── Context ───────────────────────────────────────────────────────────────
  const { locationName, geoLoading, searchLocation, selectLocation } = useWeather()
  const { theme, toggleTheme } = useTheme()

  // ── Search state ──────────────────────────────────────────────────────────
  const [query,     setQuery]     = useState('')     // text in the input
  const [results,   setResults]   = useState([])     // geocoding result list
  const [searching, setSearching] = useState(false)  // spinner while API runs
  const [open,      setOpen]      = useState(false)  // dropdown visible?

  const inputRef    = useRef(null)
  const wrapRef     = useRef(null)   // wraps input + dropdown
  const debounceRef = useRef(null)   // debounce timer ref

  // ── Close dropdown when user clicks anywhere outside search area ──────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Handle input change with 350ms debounce ───────────────────────────────
  // Debouncing prevents an API call on every single keystroke
  const handleInput = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    clearTimeout(debounceRef.current)

    if (!val.trim()) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const { results: r } = await searchLocation(val)
      setResults(r)
      setSearching(false)
    }, 350)
  }, [searchLocation])

  // ── User picks a city from dropdown ──────────────────────────────────────
  const handleSelect = (r) => {
    selectLocation(r)       // updates global coords + locationName
    setQuery('')            // clear input
    setResults([])
    setOpen(false)
  }

  // ── Keyboard: close on Escape ─────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  return (
    <nav className={styles.nav}>

      {/* ── 1. Brand ── */}
      <div className={styles.brand}>
        <span className={styles.logo}>◈</span>
        <span className={styles.brandName}>WeatherLens</span>
      </div>

      {/* ── 2. Page navigation links ── */}
      <div className={styles.links}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Current
        </NavLink>
        <NavLink
          to="/historical"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Historical
        </NavLink>
      </div>

      {/* ── Right side: search + theme toggle ── */}
      <div className={styles.right}>

        {/* ── 3. Location search ── */}
        {/* Auto-detect runs on load (WeatherContext GPS).          */}
        {/* This search box lets the user OVERRIDE to any city.     */}
        <div className={styles.searchWrap} ref={wrapRef}>

          {/* Input row */}
          <div className={styles.searchBox}>
            {/* Icon changes to spinner while geocoding API runs */}
            <span className={`${styles.searchIcon} ${searching ? styles.spin : ''}`}>
              {searching ? '⟳' : '🔍'}
            </span>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInput}
              onFocus={() => { if (results.length) setOpen(true) }}
              onKeyDown={handleKeyDown}
              placeholder={geoLoading ? 'Detecting location…' : (locationName || 'Search any city…')}
              className={styles.searchInput}
              autoComplete="off"
              spellCheck={false}
              aria-label="Search city"
            />

            {/* Clear button — only visible when query has text */}
            {query && (
              <button
                className={styles.clearBtn}
                onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* ── Dropdown results list ── */}
          {open && results.length > 0 && (
            <div className={styles.dropdown}>
              {results.map((r) => (
                <button
                  key={r.id}
                  className={styles.resultItem}
                  onClick={() => handleSelect(r)}
                >
                  <span className={styles.resultPin}>📍</span>
                  <span className={styles.resultText}>
                    {/* City name */}
                    <span className={styles.resultCity}>{r.name}</span>
                    {/* State + Country subtitle */}
                    <span className={styles.resultSub}>
                      {r.admin1 ? `${r.admin1}, ` : ''}{r.country}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {open && query && !searching && results.length === 0 && (
            <div className={styles.dropdown}>
              <p className={styles.noResults}>No cities found for "{query}"</p>
            </div>
          )}
        </div>

        {/* ── 4. Theme toggle — animated pill switch ── */}
        {/*
          Works by:
          - ThemeContext reads localStorage on init (default = dark)
          - toggleTheme() flips dark ↔ light
          - ThemeContext sets data-theme="light" on <html>
          - index.css [data-theme="light"] overrides all CSS variables
          - The entire app re-colours with a 0.3s CSS transition
        */}
        <button
          className={`${styles.themeToggle} ${theme === 'light' ? styles.themeLight : ''}`}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle colour theme"
        >
          {/* Track background */}
          <span className={styles.themeTrack}>
            {/* Icons on each side of the track */}
            <span className={styles.trackIconLeft}>🌙</span>
            <span className={styles.trackIconRight}>☀</span>
            {/* Sliding knob */}
            <span className={styles.themeKnob} />
          </span>
          {/* Text label beside the toggle */}
          <span className={styles.themeLabel}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

      </div>
    </nav>
  )
}
