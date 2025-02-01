import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: [
      { find: '@react-three/xr', replacement: path.resolve(__dirname, '../../packages/react/xr/src/index.ts') },
      {
        find: '@pmndrs/pointer-events',
        replacement: path.resolve(__dirname, '../../packages/pointer-events/src/index.ts'),
      },
    ],
    dedupe: ['@react-three/fiber', 'three'],
  },
})
