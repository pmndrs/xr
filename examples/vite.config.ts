import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.hdr', '**/*.gltf'],
  plugins: [react(), vanillaExtractPlugin()]
})
