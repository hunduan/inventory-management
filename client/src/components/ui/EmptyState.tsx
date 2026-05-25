import { View, Text } from '@tarojs/components';
import React from 'react';

type Props = { message?: string };

export default function EmptyState({ message = '暂无数据' }: Props) {
  return (
    <View className="py-10 text-center">
      <Text className="text-sm" style={{ color: '#a8a29e' }}>{message}</Text>
    </View>
  );
}
