import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Raise the chunk size warning threshold slightly (default 500kb)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Core React runtime — cached long-term by browsers
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Router — shared across all pages
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
          // Animation library — only needed on animated pages
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          // PDF export — only triggered by explicit user action (dynamic import)
          if (id.includes('node_modules/jspdf/')) {
            return 'vendor-pdf';
          }
          // Diagram renderer — only on IdeaDetail page (dynamic import)
          if (id.includes('node_modules/mermaid/') || id.includes('node_modules/@mermaid-js/')) {
            return 'vendor-mermaid';
          }
          // Data fetching — needed on authenticated pages
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          // Icon library — shared everywhere but tree-shaken per bundle
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
})

