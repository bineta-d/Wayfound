import React from 'react';
import { View } from 'react-native';
import Skeleton, { SkeletonText } from './Skeleton';

export default function TripCardSkeleton() {
  return (
    <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <View className="flex-row justify-between items-start mb-4">
        <Skeleton width="60%" height={18} />
        <Skeleton width="30%" height={14} />
      </View>
      
      <View className="flex-row items-center">
        <Skeleton width={20} height={20} borderRadius={10} className="mr-3" />
        <Skeleton width="50%" height={16} />
      </View>
    </View>
  );
}
