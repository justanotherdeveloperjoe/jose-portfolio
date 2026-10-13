import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { weatherRelay } from './scripts/weather-dev.mjs';

export default defineConfig({
  plugins: [react(), weatherRelay()],
  build: {
    outDir: 'dist',
  },
});
