import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        fetchUserProfile();
    }, [user]);

    useFocusEffect(
        React.useCallback(() => {
            fetchUserProfile();
        }, [user])
    );

    const fetchUserProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setUserProfile(data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

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

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('🔍 Settings: Deleting user account...');
                        await deleteAccount();
                    },
                },
            ]
        );
    };

    const deleteAccount = async () => {
        try {
            if (!user) return;

            console.log('🔍 Settings: Starting account deletion for user:', user.id);

            // First, delete user profile from users table
            const { error: profileError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

            if (profileError) {
                console.log('🔍 Settings: Profile deletion failed:', profileError.message);
                Alert.alert('Error', 'Failed to delete profile data');
                return;
            }
            console.log('🔍 Settings: Profile deleted successfully from users table');

            // Delete profile picture from storage if it exists
            const { error: storageError } = await supabase.storage
                .from('profiles')
                .remove([`${user.id}/profile`]);

            if (storageError) {
                console.log('🔍 Settings: Profile picture deletion failed:', storageError.message);
                // Continue even if storage deletion fails
            } else {
                console.log('🔍 Settings: Profile picture deleted successfully');
            }

            // Now delete the auth user using the SQL function (which handles both tables)
            const { error: authError } = await supabase.rpc('admin_delete_user', {
                user_id: user.id
            });

            if (authError) {
                console.log('🔍 Settings: Auth user deletion failed:', authError.message);
                Alert.alert('Error', 'Failed to delete authentication data. Please contact support.');
                return;
            } else {
                console.log('🔍 Settings: Auth user deleted successfully');
            }

            // Sign out the user
            await signOut();

            console.log('🔍 Settings: Account deletion completed successfully');
            Alert.alert('Success', 'Your account has been deleted successfully.');

            // Manually redirect to login page
            router.replace('/(auth)/login');

        } catch (error) {
            console.log('🔍 Settings: Account deletion error:', error);
            Alert.alert('Error', 'An unexpected error occurred while deleting your account.');
        }
    };

    const handleEditProfile = () => {
        router.push('/screens/editProfile');
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
                        {userProfile?.avatar_url ? (
                            <Image
                                source={{ uri: userProfile.avatar_url }}
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
                    className="bg-red-500 py-3 rounded-lg items-center mb-3"
                >
                    <Text className="text-white font-semibold text-base">Log Out</Text>
                </TouchableOpacity>

                {/* Delete Account Button */}
                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    className="bg-gray-800 py-3 rounded-lg items-center"
                >
                    <Text className="text-white font-semibold text-base">Delete Account</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
