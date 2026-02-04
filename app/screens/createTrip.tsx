import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { createTrip } from '../../lib/TripService';
import Redirect from 'react-native'

export default function CreateTripScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        destination: '',
        start_date: '',
        end_date: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateTrip = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to create a trip');
            return;
        }

        if (!formData.title || !formData.destination || !formData.start_date || !formData.end_date) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            await createTrip(
                formData.title,
                formData.destination,
                formData.start_date,
                formData.end_date,
                user.id
            );

            Alert.alert('Success', 'Trip created successfully');
            router.push('/(tabs)/home');
        } catch (error) {
            console.error('Error creating trip:', error);
            Alert.alert('Error', 'Failed to create trip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-6 pt-12 pb-6">
                <Text className="text-2xl font-bold text-gray-800">Create New Trip</Text>
                <Text className="text-gray-600 mt-2">Plan your next adventure</Text>
            </View>

            <View className="bg-white px-6 py-4">
                <Text className="text-gray-700 text-base font-semibold mb-2">Trip Title</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Enter trip title"
                    value={formData.title}
                    onChangeText={(value) => handleInputChange('title', value)}
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Destination</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Enter destination"
                    value={formData.destination}
                    onChangeText={(value) => handleInputChange('destination', value)}
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Start Date</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="YYYY-MM-DD"
                    value={formData.start_date}
                    onChangeText={(value) => handleInputChange('start_date', value)}
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">End Date</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-6"
                    placeholder="YYYY-MM-DD"
                    value={formData.end_date}
                    onChangeText={(value) => handleInputChange('end_date', value)}
                />

                <TouchableOpacity
                    onPress={handleCreateTrip}
                    className="bg-blue-500 py-3 rounded-lg items-center"
                    disabled={loading}
                >
                    <Text className="text-white font-semibold text-base">
                        {loading ? 'Creating...' : 'Create Trip'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
