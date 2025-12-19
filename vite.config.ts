import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // エントリ（メイン JS）を常に同じ名前にする
        entryFileNames: 'assets/art_matrix.js',
        // 分割チャンクは名前ベースに（必要なら固定化）
        chunkFileNames: 'assets/[name].js',
        // アセット（CSS など）は name を見て CSS を固定化、それ以外は元の拡張子を保持
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/art_matrix.css'
          }
          return 'assets/[name][extname]'
        }
      }
    }
  },
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
