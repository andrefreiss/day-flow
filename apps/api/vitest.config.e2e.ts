import { existsSync } from 'node:fs';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.DATABASE_TEST_URL ?? '',
    },
  },
});
