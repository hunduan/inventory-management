import { View, Text } from '@tarojs/components';
import React from 'react';

type Props = {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
};

export default function KpiCard({ label, value, subtitle, color }: Props) {
  return (
    <View className="kpi card">
      <Text className="text-sm" style={{ color: '#78716c', marginBottom: 6 }}>{label}</Text>
      <Text className="text-2xl" style={{ color: color || '#1c1917', fontWeight: 700 }}>{value}</Text>
      {subtitle && <Text className="text-xs" style={{ color: '#a8a29e', marginTop: 6 }}>{subtitle}</Text>}
    </View>
  );
}
