import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    setupFiles: ["src/testUtils/actSetup.ts"],
  }
})
