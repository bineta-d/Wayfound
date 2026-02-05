import React from 'react';
import { View, Text } from 'react-native';

export default function MapScreen() {
    return (
        <View className="bg-white px-6 py-6 mb-2">
            <Text className="text-xl font-bold text-gray-800 mb-4">Location</Text>
            <View className="bg-gray-200 rounded-lg h-48 items-center justify-center mb-4">
                <Text className="text-gray-600 text-center mb-2">🗺️</Text>
                <Text className="text-gray-700 text-center font-medium">Interactive Map</Text>
                <Text className="text-gray-500 text-sm">Google Maps integration coming soon</Text>
            </View>
        </View>
    );
}
