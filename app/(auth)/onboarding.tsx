import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OnboardingScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        avatarUrl: '',
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
            setFormData(prev => ({ ...prev, avatarUrl: result.assets[0].uri }));
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        if (event.type === 'set' && selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, dob: dateString }));
        }
        setShowDatePicker(false);
    };

    const handleCompleteProfile = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        if (!formData.fullName || !formData.dob) {
            Alert.alert('Error', 'Please fill in all required fields (Full Name, Date of Birth)');
            return;
        }

        // Validate DOB format (YYYY-MM-DD)
        const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dobRegex.test(formData.dob)) {
            Alert.alert('Error', 'Invalid date format');
            return;
        }

        setLoading(true);

        try {
            // Upload profile picture if provided
            let avatarUrl = formData.avatarUrl;
            if (formData.avatarUrl && formData.avatarUrl.startsWith('file://')) {
                const { uploadProfilePicture } = await import('../../lib/storage');
                avatarUrl = await uploadProfilePicture(user.id, formData.avatarUrl);
                if (!avatarUrl) {
                    console.log('🔍 Onboarding: Profile picture upload failed, continuing without it');
                } else {
                    console.log('🔍 Onboarding: Profile picture uploaded successfully');
                }
            }

            // Update user profile
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: formData.fullName,
                    dob: formData.dob,
                    avatar_url: avatarUrl,
                })
                .eq('id', user.id);

            if (error) {
                console.log('🔍 Onboarding: Profile update failed:', error.message);
                Alert.alert('Error', 'Failed to update profile');
            } else {
                console.log('🔍 Onboarding: Profile updated successfully');
                Alert.alert('Success', 'Profile completed successfully!');
                router.replace('/(tabs)/home');
            }
        } catch (error) {
            console.log('🔍 Onboarding: Unexpected error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const skipOnboarding = async () => {
        router.replace('/(tabs)/home');
    };

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <Text className="text-2xl font-bold mb-4">Complete Your Profile</Text>
            <Text className="text-gray-600 text-center mb-8">
                Welcome! Please add a few more details to complete your profile.
            </Text>

            <View className="w-full max-w-sm">
                <Text className="text-gray-700 text-base font-semibold mb-2">Full Name</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChangeText={(value) => handleInputChange('fullName', value)}
                    autoCapitalize="words"
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Date of Birth</Text>
                <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text className="text-gray-800">
                        {formData.dob || 'Select date of birth'}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                <Text className="text-gray-700 text-base font-semibold mb-2">Profile Picture (Optional)</Text>
                <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-4 mb-6"
                    onPress={pickImage}
                >
                    <Text className="text-center text-gray-600">Profile Picture (Optional)</Text>
                    {selectedImage ? (
                        <Image
                            source={{ uri: selectedImage }}
                            className="w-20 h-20 rounded-full mx-auto mt-2"
                        />
                    ) : (
                        <Text className="text-center text-gray-400 mt-2">Tap to select image</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full bg-blue-500 rounded-lg p-4 mb-4"
                    onPress={handleCompleteProfile}
                    disabled={loading}
                >
                    <Text className="text-white text-center font-semibold">
                        {loading ? 'Saving...' : 'Complete Profile'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-4"
                    onPress={skipOnboarding}
                >
                    <Text className="text-gray-700 text-center">Skip for now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
