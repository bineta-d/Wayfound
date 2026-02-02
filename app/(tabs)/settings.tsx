import React from 'react';
import { View, Text, TouchableOpacity, Alert, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('🔍 Settings: User logging out...');
                        await signOut();
                        console.log('🔍 Settings: User logged out successfully');
                        // Manually redirect to login page
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const handleEditProfile = () => {
        // TODO: Navigate to edit profile screen
        console.log('🔍 Settings: Edit profile pressed');
    };

    const settingsItems = [
        { icon: 'person-outline', label: 'Account', onPress: () => console.log('Account pressed') },
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => console.log('Notifications pressed') },
        { icon: 'lock-closed-outline', label: 'Privacy', onPress: () => console.log('Privacy pressed') },
        { icon: 'card-outline', label: 'Currency', onPress: () => console.log('Currency pressed') },
        { icon: 'language-outline', label: 'Language', onPress: () => console.log('Language pressed') },
        { icon: 'information-circle-outline', label: 'About', onPress: () => console.log('About pressed') },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header with user profile */}
            <View className="bg-white px-6 pt-12 pb-6">
                <View className="items-center">
                    {/* Avatar */}
                    <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-3">
                        {user?.user_metadata?.avatar_url ? (
                            <Image
                                source={{ uri: user.user_metadata.avatar_url }}
                                className="w-20 h-20 rounded-full"
                            />
                        ) : (
                            <Ionicons name="person" size={40} color="#9CA3AF" />
                        )}
                    </View>

                    {/* User email */}
                    <Text className="text-lg text-gray-800 mb-3">
                        {user?.email || 'Loading...'}
                    </Text>

                    {/* Edit Profile Button */}
                    <TouchableOpacity
                        onPress={handleEditProfile}
                        className="bg-blue-500 px-6 py-2 rounded-lg"
                    >
                        <Text className="text-white font-medium">Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Settings List */}
            <View className="bg-white mt-2">
                {settingsItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={item.onPress}
                        className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100"
                    >
                        <View className="flex-row items-center">
                            <Ionicons name={item.icon as any} size={24} color="#4B5563" />
                            <Text className="ml-3 text-base text-gray-800">{item.label}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <View className="px-6 mt-6">
                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-red-500 py-3 rounded-lg items-center"
                >
                    <Text className="text-white font-semibold text-base">Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
