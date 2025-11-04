import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react(), tailwindcss()],

    // 根据命令动态设置 base
    base:
      command === 'build'
        ? '/cs-major-tool/' // 生产环境 (npm run build)
        : '/', // 开发环境 (npm run dev)
  };
});
