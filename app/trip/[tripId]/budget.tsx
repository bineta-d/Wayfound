import React from 'react';
import { View, Text } from 'react-native';

export default function BudgetScreen() {
    return (
        <View className="bg-white px-6 py-6 mb-2">
            <Text className="text-xl font-bold text-gray-800 mb-4">Budget</Text>

            <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <Text className="text-gray-500 text-center">
                    Budget tracking and expense management coming soon
                </Text>
            </View>
        </View>
    );
}
