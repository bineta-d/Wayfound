import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

export default function CreateScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-white p-5">
            <Text className="text-2xl font-bold mb-2">Create Trip</Text>
            <View className="h-px w-4/5 bg-gray-300 my-8" />
            <Text className="text-base text-gray-600 mb-10">Start planning your next adventure</Text>

            <TouchableOpacity className="bg-blue-500 px-8 py-4 rounded-full shadow-lg">
                <Text className="text-white text-lg font-semibold">+ Create New Trip</Text>
            </TouchableOpacity>
        </View>
    );
}
