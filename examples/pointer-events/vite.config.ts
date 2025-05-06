import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
  },
  resolve: {
    dedupe: ['three'],
  },
  base: '/pointer-events/',
})
