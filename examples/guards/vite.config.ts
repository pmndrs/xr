import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/xr/examples/guards/',
  plugins: [react(), basicSsl()],
  resolve: {
    dedupe: ['@react-three/fiber', 'three'],
  },
})
