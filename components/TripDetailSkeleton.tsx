import React from 'react';
import { View } from 'react-native';
import Skeleton, { SkeletonText, SkeletonAvatar, SkeletonList } from './Skeleton';

export function HeaderSkeleton() {
  return (
    <View className="bg-white px-6 py-6 border-b border-gray-200">
      <Skeleton width="80%" height={32} className="mb-2" />
      <View className="flex-row items-center mb-2">
        <Skeleton width={24} height={24} borderRadius={12} className="mr-2" />
        <Skeleton width="60%" height={18} />
      </View>
      <View className="flex-row items-center">
        <Skeleton width={24} height={24} borderRadius={12} className="mr-2" />
        <Skeleton width="50%" height={16} />
      </View>
    </View>
  );
}

export function TabsSkeleton() {
  return (
    <View className="flex-row bg-white px-6 pt-4 pb-2 border-b border-gray-200">
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} className="flex-1 items-center pb-2">
          <Skeleton width="60%" height={16} />
        </View>
      ))}
    </View>
  );
}

export function MapSkeleton() {
  return (
    <View className="bg-white px-6 py-6 mb-2">
      <Skeleton width="40%" height={20} className="mb-4" />
      <View className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
        <View className="px-4 py-3 border-b border-gray-200">
          <SkeletonText lines={1} width="50%" />
        </View>
        <Skeleton width="100%" height={200} borderRadius={0} />
      </View>
    </View>
  );
}

export function TargetSpotsSkeleton() {
  return (
    <View className="bg-white px-6 py-6 mb-2">
      <View className="flex-row justify-between items-center mb-3">
        <Skeleton width="40%" height={20} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <View className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg">
            <Skeleton width="70%" height={16} />
            <Skeleton width={16} height={16} borderRadius={8} />
          </View>
        ))}
      </View>
      <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
        <Skeleton width="50%" height={16} />
      </View>
    </View>
  );
}

export function ItinerarySkeleton() {
  return (
    <View className="bg-white px-6 py-6 mb-2">
      <Skeleton width="40%" height={20} className="mb-4" />
      <View className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className="bg-gray-50 rounded-lg p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Skeleton width="60%" height={18} />
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <SkeletonText lines={2} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function CollaboratorsSkeleton() {
  return (
    <View className="bg-white px-6 py-6 mb-2">
      <View className="flex-row justify-between items-center mb-4">
        <Skeleton width="40%" height={20} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>
      <SkeletonList items={2} />
    </View>
  );
}

export function TripDetailSkeleton() {
  return (
    <View className="flex-1 bg-gray-50">
      <HeaderSkeleton />
      <TabsSkeleton />
      <MapSkeleton />
      <TargetSpotsSkeleton />
      <ItinerarySkeleton />
      <CollaboratorsSkeleton />
    </View>
  );
}