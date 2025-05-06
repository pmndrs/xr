import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/xr/examples/minecraft/',
  resolve: {
    dedupe: ['@react-three/fiber', 'three'],
  },
})
