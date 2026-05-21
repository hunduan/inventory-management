import type { UserConfig } from '@tarojs/taro';

const config: UserConfig = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify('https://api.your-domain.com/api')
  }
};

export default config;
