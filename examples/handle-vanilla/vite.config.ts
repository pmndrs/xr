import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

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
