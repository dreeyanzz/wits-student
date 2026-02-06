import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  
  server: {
    port: 5173,
    open: true,
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    sourcemap: false,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/components/')) {
            return 'components';
          }
          // Combine services and utils into one chunk to avoid circular dependency warning
          if (id.includes('/services/') || id.includes('/utils/')) {
            return 'services';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },
})
