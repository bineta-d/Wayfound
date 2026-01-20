import React from 'react';
import { Text, View } from 'react-native';

export default function ExploreScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold">Explore</Text>
      <View className="h-px w-4/5 bg-gray-300 my-8" />
      <Text className="text-base text-gray-600">Discover new destinations and experiences</Text>
    </View>
  );
}
