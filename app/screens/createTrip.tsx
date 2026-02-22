import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
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
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

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

    const handleDateChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
        if (event.type === 'set' && selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            if (type === 'start') {
                setStartDate(selectedDate);
                handleInputChange('start_date', dateString);
            } else {
                setEndDate(selectedDate);
                handleInputChange('end_date', dateString);
            }
        }
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
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
                console.log(`Added ${validMembers.length} members to trip`);
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
                <GooglePlacesAutocomplete
                    placeholder='Search for a city or destination'
                    onPress={(data, details = null) => {
                        handleInputChange('destination', data.description);
                    }}
                    query={{
                        key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
                        language: 'en',
                        types: '(cities)',
                    }}
                    styles={{
                        textInput: {
                            height: 48,
                            borderWidth: 1,
                            borderColor: '#d1d5db',
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            marginBottom: 16,
                            fontSize: 16,
                        },
                        container: {
                            flex: 0,
                        },
                    }}
                    textInputProps={{
                        placeholderTextColor: '#9ca3af',
                    }}
                    fetchDetails={true}
                    onTimeout={() => console.log('Google Places timeout')}
                    onFail={(error) => console.error('Google Places error:', error)}
                    minLength={2}
                    debounce={300}
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Start Date</Text>
                <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    onPress={() => setShowStartDatePicker(true)}
                >
                    <Text className="text-gray-800">
                        {formData.start_date || 'Select start date'}
                    </Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => handleDateChange(event, date, 'start')}
                    />
                )}

                <Text className="text-gray-700 text-base font-semibold mb-2">End Date</Text>
                <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-4 mb-6"
                    onPress={() => setShowEndDatePicker(true)}
                >
                    <Text className="text-gray-800">
                        {formData.end_date || 'Select end date'}
                    </Text>
                </TouchableOpacity>

                {showEndDatePicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => handleDateChange(event, date, 'end')}
                    />
                )}


                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    <TouchableOpacity className="items-center mr-6">
                        <View className="bg-blue-100 p-3 rounded-full mb-1">
                            <Ionicons name="bed" size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-xs text-neutral-textSecondary">Accommodation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center mr-6">
                        <View className="bg-green-100 p-3 rounded-full mb-1">
                            <Ionicons name="airplane" size={20} color="#10B981" />
                        </View>
                        <Text className="text-xs text-neutral-textSecondary">Flight</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center mr-6">
                        <View className="bg-purple-100 p-3 rounded-full mb-1">
                            <Ionicons name="train" size={20} color="#8B5CF6" />
                        </View>
                        <Text className="text-xs text-neutral-textSecondary">Train</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center mr-6">
                        <View className="bg-yellow-100 p-3 rounded-full mb-1">
                            <Ionicons name="bus" size={20} color="#F59E0B" />
                        </View>
                        <Text className="text-xs text-neutral-textSecondary">Bus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center mr-6">
                        <View className="bg-red-100 p-3 rounded-full mb-1">
                            <Ionicons name="car" size={20} color="#EF4444" />
                        </View>
                        <Text className="text-xs text-neutral-textSecondary">Car Rental</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center mr-6">
                        <View className="bg-pink-100 p-3 rounded-full mb-1">
                            <Ionicons name="ticket" size={20} color="#EC4899" />
                        </View>
                        <Text className="text-xs text-neutral-textSecondary">Activities</Text>
                    </TouchableOpacity>
                </ScrollView>

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
