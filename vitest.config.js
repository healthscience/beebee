import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        'examples/**',
        '**/*.config.js'
      ]
    },
    testTimeout: 30000, // 30 seconds for LLM operations
    hookTimeout: 30000
  }
});