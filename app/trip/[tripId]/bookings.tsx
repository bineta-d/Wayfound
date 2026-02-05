import React from 'react';
import { View, Text } from 'react-native';

export default function BookingsScreen() {
    return (
        <View className="bg-white px-6 py-6 mb-2">
            <Text className="text-xl font-bold text-gray-800 mb-4">Bookings</Text>

            <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-700 mb-3">Accommodation</Text>
                <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <Text className="text-gray-500 text-center">
                        Booking imports/extraction pending
                    </Text>
                </View>
            </View>

            <View>
                <Text className="text-lg font-semibold text-gray-700 mb-3">Travel Info</Text>
                <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <Text className="text-gray-500 text-center">
                        Booking imports/extraction pending
                    </Text>
                </View>
            </View>
        </View>
    );
}
