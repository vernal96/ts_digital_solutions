import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    base: './',
    server: {
        proxy: {
            '/items': 'http://localhost:3000',
            '/state': 'http://localhost:3000'
        }
    }
});