import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { createTrip, createTripMembers } from '../../lib/TripService';

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

    const [members, setMembers] = useState<{ name: string, email: string }[]>([]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMemberChange = (index: number, field: 'name' | 'email', value: string) => {
        setMembers(prev => {
            const updated = [...prev];
            if (!updated[index]) {
                updated[index] = { name: '', email: '' };
            }
            updated[index][field] = value;
            return updated;
        });
    };

    const addMemberField = () => {
        setMembers(prev => [...prev, { name: '', email: '' }]);
    };

    const removeMemberField = (index: number) => {
        setMembers(prev => prev.filter((_, i) => i !== index));
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
            const tripData = await createTrip(
                formData.title,
                formData.destination,
                formData.start_date,
                formData.end_date,
                user.id
            );

            // Add members if any are provided
            const validMembers = members.filter(m => m.name && m.email);
            if (validMembers.length > 0 && tripData && tripData[0]) {
                await createTripMembers(tripData[0].id, validMembers);
            }

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
                    className="bg-blue-500 py-3 rounded-lg items-center mb-4"
                    disabled={loading}
                >
                    <Text className="text-white font-semibold text-base">
                        {loading ? 'Creating...' : 'Create Trip'}
                    </Text>
                </TouchableOpacity>

                <View className="border-t border-gray-200 pt-4">
                    <Text className="text-gray-700 text-base font-semibold mb-3">Trip Members (Optional)</Text>

                    <ScrollView className="max-h-48">
                        {members.map((member, index) => (
                            <View key={index} className="flex-row mb-3">
                                <TextInput
                                    className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
                                    placeholder="Name"
                                    value={member.name}
                                    onChangeText={(value) => handleMemberChange(index, 'name', value)}
                                />
                                <TextInput
                                    className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
                                    placeholder="Email"
                                    value={member.email}
                                    onChangeText={(value) => handleMemberChange(index, 'email', value)}
                                />
                                <TouchableOpacity
                                    onPress={() => removeMemberField(index)}
                                    className="bg-red-500 px-3 py-2 rounded-lg justify-center"
                                >
                                    <Text className="text-white text-sm">Remove</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        onPress={addMemberField}
                        className="bg-green-500 py-2 rounded-lg items-center mt-2"
                    >
                        <Text className="text-white font-semibold">+ Add Member</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
