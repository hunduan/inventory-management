/**
 * 语音识别文本解析器
 * 将语音识别的自然语言文本解析为结构化的业务数据
 */

export interface ParsedOrderItem {
  productName: string;
  quantity: number;
  price?: number;
}

export interface ParsedOrder {
  type: 'PURCHASE' | 'SALE';
  supplierName?: string;
  customerName?: string;
  items: ParsedOrderItem[];
  remark?: string;
}

// 常见商品关键字映射（示例，实际应来自商品库）
const PRODUCT_KEYWORDS: Record<string, string> = {
  '苹果': '苹果',
  'iPhone': 'iPhone',
  '华为': '华为手机',
  '小米': '小米手机',
  '牛奶': '纯牛奶',
  '面包': '面包',
  '矿泉水': '矿泉水',
  '可乐': '可口可乐',
  '雪碧': '雪碧',
  '纸巾': '抽纸',
  '笔记本': '笔记本',
  '笔': '签字笔',
};

// 数字中文映射
const CN_NUMBERS: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

function parseChineseNumber(text: string): number {
  if (!isNaN(Number(text))) return Number(text);

  let result = 0;
  let temp = 0;

  for (const ch of text) {
    const num = CN_NUMBERS[ch];
    if (num !== undefined) {
      if (num === 10) {
        if (temp === 0) temp = 10;
        else { temp *= 10; result += temp; temp = 0; }
      } else {
        temp = num;
      }
    }
  }
  result += temp;
  return result || 0;
}

/**
 * 解析语音文本，提取商品和数量信息
 * 支持格式示例：
 * - "采购 苹果10个 牛奶5瓶"
 * - "进货 矿泉水20箱 可乐15瓶"
 * - "销售 面包3个 牛奶2瓶 给张三"
 * - "卖 苹果5斤 给李四"
 */
export function parseVoiceText(text: string): ParsedOrder {
  const result: ParsedOrder = {
    type: 'PURCHASE',
    items: [],
  };

  let remaining = text;

  // 判断业务类型
  if (/购买|采购|进货|入|进/i.test(remaining)) {
    result.type = 'PURCHASE';
  } else if (/销售|卖出|卖|出货|出/i.test(remaining)) {
    result.type = 'SALE';
  }

  // 提取供应商/客户名称
  const giveMatch = remaining.match(/给(.+?)(?:\s|$|的|采购|销售|进货|卖)/);
  if (giveMatch) {
    if (result.type === 'PURCHASE') {
      result.supplierName = giveMatch[1].trim();
    } else {
      result.customerName = giveMatch[1].trim();
    }
    remaining = remaining.replace(giveMatch[0], '');
  }

  const fromMatch = remaining.match(/从(.+?)采购|找(.+?)进/);
  if (fromMatch) {
    result.supplierName = (fromMatch[1] || fromMatch[2]).trim();
  }

  const toMatch = remaining.match(/卖给(.+?)\s|卖(.+?)给/);
  if (toMatch) {
    result.customerName = (toMatch[1] || toMatch[2]).trim();
  }

  // 移除类型关键词
  remaining = remaining.replace(/采购|进货|购买|销售|卖出|我要|请|帮我/g, '').trim();

  // 解析商品模式: "商品名 + 数量 + 单位"
  const itemPattern = /([一-鿿\w]+?)\s*(\d+\.?\d*)\s*([一-鿿]{0,2})/g;
  let match;

  while ((match = itemPattern.exec(remaining)) !== null) {
    const [_, name, qtyStr, unit] = match;
    const productName = PRODUCT_KEYWORDS[name] || name;
    const quantity = parseFloat(qtyStr);
    if (quantity > 0) {
      result.items.push({ productName, quantity });
    }
  }

  // 如果使用中文数字，尝试另一种解析
  if (result.items.length === 0) {
    const cnItemPattern = /([一-鿿]+?)\s*([零一二三四五六七八九十两]+)\s*([一-鿿]{0,2})/g;
    while ((match = cnItemPattern.exec(remaining)) !== null) {
      const [_, name, cnNum, unit] = match;
      const quantity = parseChineseNumber(cnNum);
      if (quantity > 0 && !/采购|进货|销售|卖出/g.test(name)) {
        const productName = PRODUCT_KEYWORDS[name] || name;
        result.items.push({ productName, quantity });
      }
    }
  }

  // 剩余文本作为备注
  const cleanedText = remaining.replace(itemPattern, '').replace(/\s+/g, '').trim();
  if (cleanedText && cleanedText.length > 2) {
    result.remark = cleanedText;
  }

  return result;
}
