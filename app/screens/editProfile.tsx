import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { uploadProfilePicture } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

export default function EditProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
    });

    useEffect(() => {
        fetchUserProfile();
    }, [user]);

    const fetchUserProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('full_name, email, avatar_url')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setFormData({
                    fullName: data.full_name || '',
                    email: data.email || '',
                });
                if (data.avatar_url) {
                    setSelectedImage(data.avatar_url);
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);

        try {
            let avatarUrl = selectedImage;

            // Upload new image if one was selected
            if (selectedImage && selectedImage.startsWith('file://')) {
                const uploadedUrl = await uploadProfilePicture(user.id, selectedImage);
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                } else {
                    Alert.alert('Error', 'Failed to upload profile picture');
                    setLoading(false);
                    return;
                }
            }

            // Update user profile
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: formData.fullName,
                    avatar_url: avatarUrl,
                })
                .eq('id', user.id);

            if (error) {
                Alert.alert('Error', 'Failed to update profile');
            } else {
                Alert.alert('Success', 'Profile updated successfully');
                router.back();
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-6 pt-12 pb-6">
                <View className="items-center">
                    <TouchableOpacity onPress={pickImage} className="mb-4">
                        <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center">
                            {selectedImage ? (
                                <Image
                                    source={{ uri: selectedImage }}
                                    className="w-24 h-24 rounded-full"
                                />
                            ) : (
                                <Ionicons name="person" size={40} color="#9CA3AF" />
                            )}
                        </View>
                        <Text className="text-blue-500 text-sm mt-2">Change Photo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-white px-6 py-4">
                <Text className="text-gray-700 text-base font-semibold mb-2">Full Name</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChangeText={(value) => handleInputChange('fullName', value)}
                    autoCapitalize="words"
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Email</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-6"
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={false} // Email should not be editable
                />

                <PrimaryButton
  title={loading ? 'Saving...' : 'Save Changes'}
  onPress={handleSave}
/>
            </View>
        </SafeAreaView>
    );
}
