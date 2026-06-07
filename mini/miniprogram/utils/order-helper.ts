import productsApi from '../services/products';
import { parseVoiceText } from './voice-parser';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
  subtotal: number;
}

export function addItemToOrder(
  items: OrderItem[],
  product: any,
  unitField: 'unitCost' | 'unitPrice',
  priceField: 'costPrice' | 'salePrice',
): { items: OrderItem[]; added: boolean } {
  const next = [...items];
  const existing = next.find(i => i.productId === product.id);
  if (existing) {
    existing.quantity += 1;
    existing.subtotal = existing.quantity * (existing.unitCost ?? existing.unitPrice ?? 0);
    return { items: next, added: true };
  }
  const unitPrice = Number(product[priceField]) || 0;
  next.push({
    productId: product.id,
    productName: product.name,
    quantity: 1,
    [unitField]: unitPrice,
    subtotal: unitPrice,
  });
  return { items: next, added: true };
}

export function calcTotal(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
}

export async function resolveProductByName(name: string): Promise<any | null> {
  try {
    const res = await productsApi.list({ search: name, limit: 5 });
    const list = res.data || [];
    if (list.length === 0) return null;
    const exact = list.find((p: any) => p.name === name);
    return exact || list[0];
  } catch {
    return null;
  }
}

export async function parseAndResolve(
  text: string,
  existingItems: OrderItem[],
  orderType: 'PURCHASE' | 'SALE',
  priceField: 'costPrice' | 'salePrice',
): Promise<{ items: OrderItem[]; unresolved: string[] }> {
  const parsed = parseVoiceText(text);
  if (!parsed || parsed.items.length === 0) {
    return { items: existingItems, unresolved: [] };
  }

  let items = [...existingItems];
  const unresolved: string[] = [];
  const unitField = orderType === 'PURCHASE' ? 'unitCost' : 'unitPrice';

  for (const pi of parsed.items) {
    const product = await resolveProductByName(pi.productName);
    if (product) {
      let quantity = pi.quantity || 1;
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.quantity * (existing.unitCost ?? existing.unitPrice ?? 0);
      } else {
        const unitPrice = Number(product[priceField]) || 0;
        items.push({
          productId: product.id,
          productName: product.name,
          quantity,
          [unitField]: unitPrice,
          subtotal: quantity * unitPrice,
        });
      }
    } else {
      unresolved.push(pi.productName);
    }
  }

  return { items, unresolved };
}
