import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    https: true
  },
  resolve: {
    alias: {
      '@react-three/xr': path.resolve('../src')
    }
  },
  plugins: [react()]
})
