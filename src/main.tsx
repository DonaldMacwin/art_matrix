import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.tsx'
import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

signInAnonymously(auth)
  .then(() => {
    console.log('[main] signed in anonymously')
  })
  .catch((err) => {
    console.error('[main] anonymous sign-in failed:', err)
  })
