import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@firebase/app',
      '@firebase/auth',
      '@firebase/firestore',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ]
  },
  resolve: {
    // 重複を避けるため node_modules 内の単一パスへ強制的にエイリアス
    alias: {
      'firebase': path.resolve(__dirname, 'node_modules', 'firebase'),
      'firebase/app': path.resolve(__dirname, 'node_modules', 'firebase', 'app'),
      'firebase/auth': path.resolve(__dirname, 'node_modules', 'firebase', 'auth'),
      'firebase/firestore': path.resolve(__dirname, 'node_modules', 'firebase', 'firestore'),
      '@firebase/app': path.resolve(__dirname, 'node_modules', '@firebase', 'app'),
      '@firebase/auth': path.resolve(__dirname, 'node_modules', '@firebase', 'auth'),
      '@firebase/firestore': path.resolve(__dirname, 'node_modules', '@firebase', 'firestore'),
    },
    dedupe: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})
