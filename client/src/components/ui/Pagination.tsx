import { View, Text } from '@tarojs/components';

interface Props {
  page: number;
  totalPages: number;
  total?: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ page, totalPages, total, onPrev, onNext }: Props) {
  if (totalPages <= 1) return null;

  return (
    <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
      <View
        style={{
          padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 14,
          border: '1px solid #e7e5e4', opacity: page <= 1 ? 0.4 : 1,
        }}
        onClick={() => page > 1 && onPrev()}
      >
        <Text style={{ color: '#57534e' }}>{'< 上一页'}</Text>
      </View>
      <Text style={{ fontSize: 14, color: '#a8a29e' }}>
        {page} / {totalPages}{total !== undefined ? ` · ${total} 条` : ''}
      </Text>
      <View
        style={{
          padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 14,
          border: '1px solid #e7e5e4', opacity: page >= totalPages ? 0.4 : 1,
        }}
        onClick={() => page < totalPages && onNext()}
      >
        <Text style={{ color: '#57534e' }}>{'下一页 >'}</Text>
      </View>
    </View>
  );
}
