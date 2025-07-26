import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './src/App.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
