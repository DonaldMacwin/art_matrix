import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.tsx'
import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'

const root = createRoot(document.getElementById('root')!)

// Sign in anonymously for local/dev Firestore access when rules require auth.
// If anonymous sign-in fails we'll still render the app but log the error.
signInAnonymously(auth)
  .then(() => {
    console.log('[main] signed in anonymously')
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((err) => {
    console.error('[main] anonymous sign-in failed:', err)
    // Render app anyway to show error UI — DetailPage will show debug info.
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
