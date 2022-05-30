import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.resolve('/').replace(/\\+/g, '/')
const external = (id) => !id.startsWith('.') && !id.startsWith(root)

export default defineConfig({
  server: {
    https: true
  },
  plugins: [react()],
  publicDir: process.env.NODE_ENV === 'production' ? false : 'public',
  root: 'examples',
  resolve: {
    alias: {
      '@react-three/xr': path.resolve(process.cwd(), 'src')
    }
  },
  build: {
    minify: false,
    outDir: path.resolve(process.cwd(), 'dist'),
    emptyOutDir: true,
    target: 'esnext',
    lib: {
      formats: ['es', 'cjs'],
      entry: path.resolve(process.cwd(), 'src/index.tsx'),
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js')
    },
    rollupOptions: {
      external
    }
  }
})
