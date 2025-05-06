import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [basicSsl()],
  build: {
    outDir: './dist',
  },
  base: '/handle-vanilla/',
  resolve: {
    dedupe: ['three'],
  },
})
