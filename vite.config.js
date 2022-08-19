import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = {
  serve: {
    root: 'examples',
    plugins: [react()],
    resolve: {
      alias: {
        '@react-three/xr': path.resolve(process.cwd(), 'src')
      }
    }
  },
  build: {
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
    }
  }
}

export default defineConfig(({ command }) => config[command])
