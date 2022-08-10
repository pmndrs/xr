import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const dev = defineConfig({
  root: 'examples',
  plugins: [react()],
  resolve: {
    alias: {
      '@react-three/xr': path.resolve(process.cwd(), 'src')
    }
  }
})

const build = defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    target: 'es2018',
    lib: {
      formats: ['es', 'cjs'],
      entry: 'src/index.tsx',
      fileName: '[name]'
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !path.isAbsolute(id),
      output: {
        preserveModules: true,
        sourcemapExcludeSources: true
      }
    }
  },
  plugins: [
    {
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'index.d.ts', source: `export * from '../src'` })
      }
    }
  ]
})

export default process.argv[2] ? build : dev
