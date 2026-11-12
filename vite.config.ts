import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 等价于监听所有网卡
    port: 2084,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 2084,
      clientPort: 2084,
    },
    watch: {
      usePolling: true, // Windows 下文件监听经常靠这个
      interval: 300,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: '/three-lab/' 
})