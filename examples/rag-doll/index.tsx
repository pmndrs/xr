import { createRoot } from 'react-dom/client'
//@ts-ignore
import { App } from './src/App.jsx'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
