import React from 'react';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold mb-2">Welcome to Wayfound</Text>
      <View className="h-px w-4/5 bg-gray-300 my-8" />
      <Text className="text-base text-gray-600">Your travel companion app</Text>

      <View className="mt-8 px-6">
        <Text className="text-center text-blue-500 font-semibold">
          🎉 NativeWind is working!
        </Text>
      </View>
    </View>
  );
}
