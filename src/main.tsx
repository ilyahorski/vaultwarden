import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AudioProvider } from './context/AudioContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/play" replace />} />
          <Route path="/play" element={<App initialMode="player" />} />
          <Route path="/editor" element={<App initialMode="dm" />} />
        </Routes>
      </BrowserRouter>
    </AudioProvider>
  </StrictMode>,
)
