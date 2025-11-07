import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 获取环境变量 VITE_BASE_PATH，如果没有设置，则默认为根路径 '/'
const VITE_BASE_PATH = process.env.VITE_BASE_PATH || '/';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // 在开发环境，我们仍然使用根路径
  if (command === 'serve') {
    return {
      plugins: [react(), tailwindcss()],
      base: '/',
    };
  }

  // 生产环境 (command === 'build') 使用环境变量的值
  return {
    plugins: [react(), tailwindcss()],
    base: VITE_BASE_PATH,
  };
});
