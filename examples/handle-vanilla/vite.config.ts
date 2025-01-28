import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
  },
  base: '/pointer-events/',
  resolve: {
    alias: [
      {
        find: '@pmndrs/pointer-events',
        replacement: path.resolve(__dirname, '../../packages/pointer-events/src/index.ts'),
      },
    ],
    dedupe: ['three'],
  },
})
