/**
 * App.jsx
 * -------
 * Root component. Sets up:
 *   - ThemeProvider  (dark / light theme via data-theme on <html>)
 *   - WeatherProvider (GPS context + location search)
 *   - React Router (Page 1 and Page 2)
 *   - The persistent Navbar
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { WeatherProvider } from './context/WeatherContext'
import Navbar from './components/Navbar'
import CurrentPage from './pages/CurrentPage'
import HistoricalPage from './pages/HistoricalPage'

export default function App() {
  return (
    <ThemeProvider>
      <WeatherProvider>
        <BrowserRouter>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: '40px' }}>
            <Routes>
              <Route path="/"           element={<CurrentPage />} />
              <Route path="/historical" element={<HistoricalPage />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </WeatherProvider>
    </ThemeProvider>
  )
}
