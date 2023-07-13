import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@react-three/xr': path.resolve(__dirname, '../src')
    }
  },
  assetsInclude: ['**/*.hdr', '**/*.gltf'],
  plugins: [react(), vanillaExtractPlugin()]
})
