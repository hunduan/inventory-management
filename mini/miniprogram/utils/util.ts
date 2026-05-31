/**
 * 工具函数
 */

// 格式化日期时间
export function formatDate(dateStr: string | Date, fmt: string = 'YYYY-MM-DD HH:mm'): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const pad = (n: number) => String(n).padStart(2, '0');

  const map: Record<string, () => string> = {
    'YYYY': () => String(date.getFullYear()),
    'MM': () => pad(date.getMonth() + 1),
    'DD': () => pad(date.getDate()),
    'HH': () => pad(date.getHours()),
    'mm': () => pad(date.getMinutes()),
    'ss': () => pad(date.getSeconds()),
  };

  let result = fmt;
  for (const [key, fn] of Object.entries(map)) {
    result = result.replace(key, fn());
  }
  return result;
}

// 格式化金额
export function formatMoney(amount: number | string, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}

// 格式化数量（去掉多余的 .00）
export function formatQuantity(qty: number | string): string {
  const num = typeof qty === 'string' ? parseFloat(qty) : qty;
  if (isNaN(num)) return '0';
  const fixed = num.toFixed(2);
  return fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed;
}

// 生成随机颜色 (用于头像等)
export function randomColor(str: string): string {
  const colors = ['#0f766e', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// 获取状态的中文名称
export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    'DRAFT': '草稿',
    'CONFIRMED': '已确认',
    'RECEIVED': '已入库',
    'DELIVERED': '已出库',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'CANCELLED': '已作废',
  };
  return map[status] || status;
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) return;
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}
