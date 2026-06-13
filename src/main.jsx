import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './index.css'
import App from './App.jsx'
import { applyEquippedTheme } from './utils/unlockables'

// Apply the equipped accent theme before first paint (no flash of default).
applyEquippedTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
