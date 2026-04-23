import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/application/**/*.use-case.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
