import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react', '@fortawesome/react-fontawesome', '@fortawesome/free-brands-svg-icons'],
        },
      },
    },
    minify: 'terser',
    cssMinify: true,
    cssCodeSplit: true,
  },
});