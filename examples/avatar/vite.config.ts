import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    dedupe: ['@react-three/fiber', 'three'],
  },
})
