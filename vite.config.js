import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Path alias for cleaner imports
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  
  // Build optimizations
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for security
    minify: 'terser',
    cssCodeSplit: true, // Split CSS by component
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
        // Ensure assets are placed in the correct directory
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  
  // Dev server config
  server: {
    port: 5173,
    open: true, // Auto-open browser
  },
})