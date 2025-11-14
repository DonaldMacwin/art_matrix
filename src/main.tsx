import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.tsx'
import { signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'

console.log('[main] script loaded') // 追加: スクリプト読込の確認

const root = createRoot(document.getElementById('root')!)

// まず即座に描画して空白ページを避ける（デバッグ用）
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
