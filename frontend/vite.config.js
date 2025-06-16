import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/items': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/select': { target: 'http://localhost:3000', changeOrigin: true },
            '/deselect': { target: 'http://localhost:3000', changeOrigin: true },
            '/reorder': { target: 'http://localhost:3000', changeOrigin: true }
        }
    }
});