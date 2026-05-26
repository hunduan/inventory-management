const isWeapp = process.env.TARO_ENV === 'weapp';

const webPages = [
  'pages/web/login/index',
  'pages/web/dashboard/index',
  'pages/web/purchases/index',
  'pages/web/purchases/new',
  'pages/web/sales/index',
  'pages/web/sales/new',
  'pages/web/inventory/index',
  'pages/web/products/index',
  'pages/web/products/new',
  'pages/web/categories/index',
  'pages/web/warehouses/index',
  'pages/web/customers/index',
  'pages/web/suppliers/index',
  'pages/web/stocktake/index',
  'pages/web/transfers/index',
  'pages/web/reports/index',
  'pages/web/settings/index',
  'pages/web/register/index',
];

const miniPages = [
  'pages/mini/login/index',
  'pages/mini/index/index',
  'pages/mini/purchase-list/index',
  'pages/mini/sale-list/index',
  'pages/mini/inventory/index',
  'pages/mini/more/index',
  'pages/mini/scan/index',
  'pages/mini/voice/index',
  'pages/mini/photo/index',
  'pages/mini/purchase/index',
  'pages/mini/sale/index',
  'pages/mini/orders/list',
  'pages/mini/orders/detail',
  'pages/mini/products/index',
  'pages/mini/transfers/index',
];

export default {
  pages: isWeapp ? miniPages : [...webPages, ...miniPages],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '进销存',
    navigationBarTextStyle: 'black'
  },
  ...(isWeapp ? {
    tabBar: {
      color: '#a8a29e',
      selectedColor: '#0f766e',
      backgroundColor: '#ffffff',
      borderStyle: 'white',
      list: [
        { pagePath: 'pages/mini/index/index', text: '首页', iconPath: 'assets/icons/home.png', selectedIconPath: 'assets/icons/home.png' },
        { pagePath: 'pages/mini/purchase-list/index', text: '入库', iconPath: 'assets/icons/purchase.png', selectedIconPath: 'assets/icons/purchase.png' },
        { pagePath: 'pages/mini/sale-list/index', text: '出库', iconPath: 'assets/icons/sale.png', selectedIconPath: 'assets/icons/sale.png' },
        { pagePath: 'pages/mini/inventory/index', text: '库存', iconPath: 'assets/icons/inventory.png', selectedIconPath: 'assets/icons/inventory.png' },
        { pagePath: 'pages/mini/more/index', text: '更多', iconPath: 'assets/icons/more.png', selectedIconPath: 'assets/icons/more.png' },
      ],
    },
  } : {}),
};
