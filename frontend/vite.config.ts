import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mediapipe/face_mesh': path.resolve(__dirname, './src/lib/mediapipe-stub.ts')
    }
  }
})
