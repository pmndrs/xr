import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/xr/examples/stage/',
  resolve: {
    dedupe: ['@react-three/fiber', 'three'],
  },
})
