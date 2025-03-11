import path from 'path'
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
    alias: [
      {
        find: '@pmndrs/pointer-events',
        replacement: path.resolve(__dirname, '../../packages/pointer-events/src/index.ts'),
      },
    ],
    dedupe: ['three'],
  },
})
