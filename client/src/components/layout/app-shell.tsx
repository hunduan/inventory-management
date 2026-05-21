import { View, Text } from '@tarojs/components';
import { PropsWithChildren } from 'react';

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <View className="flex items-center gap-2">
          <Text className="text-xl font-bold">进销存管理</Text>
        </View>
      </View>
      <View className="p-6">
        {children}
      </View>
    </View>
  );
}
