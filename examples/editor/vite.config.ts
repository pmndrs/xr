import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/xr/examples/editor/',
  resolve: {
    alias: [{ find: '@react-three/xr', replacement: path.resolve(__dirname, '../../packages/react/xr/src/index.ts') }],
    dedupe: ['@react-three/fiber', 'three'],
  },
})
