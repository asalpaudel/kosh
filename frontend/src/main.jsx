import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installCsrf } from './lib/csrf.js'
import { API_BASE } from './lib/apiClient.js'

installCsrf(API_BASE)

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <App />
  </StrictMode>,
)
