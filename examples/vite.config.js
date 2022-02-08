import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    https: true
  },
  resolve: {
    alias: {
      '@react-three/fiber': path.resolve('../node_modules/@react-three/fiber'),
      three: path.resolve('../node_modules/three'),
      react: path.resolve('../node_modules/react'),
      'react-dom': path.resolve('../node_modules/react-dom'),
      '@react-three/xr': path.resolve('../src')
    }
  },
  plugins: [react()]
})
