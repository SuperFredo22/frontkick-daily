import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Police auto-hébergée : servie same-origin, donc cachée par le service worker
// → l'app garde sa typo hors ligne (Google Fonts cross-origin ne l'était pas)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './styles/tokens.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
