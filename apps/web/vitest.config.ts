import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: false,
  plugins: [react()],
  test: {
    env: {
      VITE_API_URL: 'http://localhost:3000/api',
    },
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
