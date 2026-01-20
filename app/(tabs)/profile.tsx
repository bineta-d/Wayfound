import React from 'react';
import { Text, View } from 'react-native';

export default function ProfileScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-xl font-bold">Profile</Text>
            <View className="h-px w-4/5 bg-gray-300 my-8" />
            <Text className="text-base text-gray-600">Manage your profile here</Text>
        </View>
    );
}
