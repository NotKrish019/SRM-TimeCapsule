import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core':   ['three'],
          'three-fiber':  ['@react-three/fiber'],
          'three-drei':   ['@react-three/drei'],
          'firebase':     ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'react-core':   ['react', 'react-dom'],
        },
      },
    },
  },
})
