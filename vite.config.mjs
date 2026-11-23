import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Percorsi relativi compatibili con GitHub Pages anche sotto /nome-repository/.
  base: './',
});
