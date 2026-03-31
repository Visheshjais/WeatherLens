/**
 * ThemeContext.jsx
 * ----------------
 * Manages the app's colour theme (dark | light).
 *
 * Strategy:
 *   - Stores preference in localStorage so it survives page refresh
 *   - Sets a `data-theme` attribute on <html> which CSS variables respond to
 *   - Exposes { theme, toggleTheme } via context
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // Read saved preference, default to 'dark'
  const [theme, setTheme] = useState(
    () => localStorage.getItem('wl-theme') || 'dark'
  )

  // Apply theme to <html data-theme="..."> whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('wl-theme', theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
