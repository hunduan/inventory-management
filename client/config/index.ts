import { defineConfig } from '@tarojs/webpack5-runner';

export default defineConfig({
  appName: '进销存管理系统',
  entry: './src/app.tsx',
  output: {
    web: './dist/web',
    weapp: './dist/weapp'
  },
  alias: {
    '@': './src'
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify('http://localhost:3000/api')
  },
  mini: {},
  h5: {
    postcss: {}
  }
});
