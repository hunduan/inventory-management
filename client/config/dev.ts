import type { UserConfig } from '@tarojs/taro';

const config: UserConfig = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify('http://localhost:3000/api')
  }
};

export default config;
