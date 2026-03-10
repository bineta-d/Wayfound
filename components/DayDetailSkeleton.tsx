import React from 'react';
import { View } from 'react-native';
import Skeleton, { SkeletonText } from './Skeleton';

export function DayHeaderSkeleton() {
  return (
    <View className="bg-neutral-surface px-6 py-6 mb-2">
      <Skeleton width="70%" height={28} className="mb-2" />
      <View className="flex-row items-center mb-2">
        <Skeleton width={20} height={20} borderRadius={10} className="mr-2" />
        <Skeleton width="50%" height={18} />
      </View>
    </View>
  );
}

export function DayMapSkeleton() {
  return (
    <View className="bg-neutral-surface px-6 py-6 mb-2">
      <Skeleton width="30%" height={20} className="mb-4" />
      <View className="rounded-lg overflow-hidden border border-neutral-divider bg-neutral-surface">
        <View className="px-4 py-3 border-b border-neutral-divider">
          <SkeletonText lines={1} width="40%" />
        </View>
        <Skeleton width="100%" height={200} borderRadius={0} />
      </View>
    </View>
  );
}

export function ActivitiesSkeleton() {
  return (
    <View className="bg-neutral-background px-6 py-6 mb-2">
      <View className="flex-row justify-between items-center mb-4">
        <Skeleton width="30%" height={20} />
        <Skeleton width={80} height={32} borderRadius={8} />
      </View>
      <View className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} className="bg-white rounded-lg p-4 border border-neutral-divider">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <View className="self-start px-2 py-1 rounded-full bg-neutral-divider mb-2">
                  <Skeleton width={60} height={12} />
                </View>
                <SkeletonText lines={1} width="80%" className="mb-1" />
                <SkeletonText lines={1} width="60%" />
              </View>
              <Skeleton width={16} height={16} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function DayDetailSkeleton() {
  return (
    <View className="flex-1 bg-neutral-background">
      <DayHeaderSkeleton />
      <DayMapSkeleton />
      <ActivitiesSkeleton />
    </View>
  );
}