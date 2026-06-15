import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './index.css'
import App from './App.jsx'
import { applyEquippedTheme } from './utils/unlockables'
import { mergeNewSeeds } from './utils/seedMerge'

// Apply the equipped accent theme before first paint (no flash of default).
applyEquippedTheme()

// Inject newly-shipped video ideas into existing banks without touching what
// the user already has (added items, deletions, edits are all preserved).
mergeNewSeeds()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
