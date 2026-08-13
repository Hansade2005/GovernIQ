import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider, applyStoredTheme } from './lib/theme.jsx'
import './index.css'

// Paint the stored theme before the first render so there's no flash.
applyStoredTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
