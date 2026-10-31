import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Use relative asset paths so the app works under the GitHub Pages
// project URL (/nameforge-V2/) as well as local previews.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('src/i18n/extraLanguages')) {
            return 'i18n-extra';
          }
          // Large editorial/translation tables change rarely: split them so browsers cache them
          // separately from the application code.
          if (
            id.includes('src/i18n/generatorContent') ||
            id.includes('src/i18n/generatorTitles') ||
            id.includes('src/i18n/localizedFaq')
          ) {
            return 'i18n-generators';
          }
          if (
            id.includes('src/data/generatorsBatch') ||
            id.includes('src/data/gamingAndSystemsGenerators')
          ) {
            return 'generators-batches';
          }
        },
      },
    },
  },
});
