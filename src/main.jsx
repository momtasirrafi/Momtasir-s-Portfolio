import * as Sentry from "@sentry/browser";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: true,
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
