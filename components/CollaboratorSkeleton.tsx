import React from 'react';
import { View } from 'react-native';
import { SkeletonList } from './Skeleton';

export default function CollaboratorSkeleton() {
  return (
    <View className="bg-white px-6 py-6 mb-2">
      <View className="flex-row justify-between items-center mb-4">
        <View className="h-6 w-32 bg-gray-300 rounded" />
        <View className="w-8 h-8 bg-gray-300 rounded-full" />
      </View>
      
      <SkeletonList items={3} />
    </View>
  );
}
