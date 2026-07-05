import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Target modern browsers — removes legacy polyfills, shrinks bundle size
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Aggressive manual chunking — splits bundle into small on-demand pieces
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React runtime — always needed first
            if (id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('react') && !id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Icon library — large, load separately
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Toast notifications — load separately
            if (id.includes('sonner')) {
              return 'vendor-ui';
            }
            // Google Auth
            if (id.includes('@react-oauth') || id.includes('google')) {
              return 'vendor-auth';
            }
            // All other node_modules
            return 'vendor';
          }
        },
        // Use content hashes for long-term caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    // Enable minification
    minify: 'esbuild',
  },

  // File types to support raw imports
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
