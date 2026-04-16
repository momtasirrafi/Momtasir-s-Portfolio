import * as Sentry from "@sentry/browser";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

Sentry.init({
  dsn: "https://cd66348e7c2bfdb0eb011c0779cba06f@o4511228170534913.ingest.us.sentry.io/4511228173746176",
  sendDefaultPii: true,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)