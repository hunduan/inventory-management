import { defineConfig } from '@tarojs/cli';

export default defineConfig({
  projectName: '进销存管理系统',
  date: '2026-05-21',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  framework: 'react',
  sourceRoot: 'src',
  outputRoot: `dist/${process.env.TARO_ENV}`,
  alias: {
    '@': './src',
  },
  plugins: ['@tarojs/plugin-platform-h5'],
  compiler: 'webpack5',
  defineConstants: {
    API_BASE_URL: JSON.stringify('http://localhost:3000/api'),
    'process.env.API_BASE_URL': JSON.stringify('http://localhost:3000/api'),
  },
  mini: {
    postcss: {
      tailwindcss: {
        enable: true,
        config: './tailwind.config.js',
      },
    },
  },
  h5: {
    postcss: {
      tailwindcss: {
        enable: true,
        config: './tailwind.config.js',
      },
    },
  },
});
