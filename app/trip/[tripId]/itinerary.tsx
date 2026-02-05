import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface ItineraryScreenProps {
    tripId: string;
    startDate: string;
    endDate: string;
}

export default function ItineraryScreen({ tripId, startDate, endDate }: ItineraryScreenProps) {
    const generateDayHeaders = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];
        const current = new Date(start);

        while (current <= end) {
            days.push({
                date: new Date(current),
                dayNumber: days.length + 1
            });
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const days = generateDayHeaders();

    return (
        <View className="bg-white px-6 py-6 mb-2">
            <Text className="text-xl font-bold text-gray-800 mb-4">Itinerary</Text>

            {/* Map Card */}
            <View className="bg-gray-200 rounded-lg h-32 items-center justify-center mb-4">
                <Text className="text-gray-600 text-center mb-2">🗺️</Text>
                <Text className="text-gray-700 text-center font-medium">Trip Map</Text>
                <Text className="text-gray-500 text-sm">AI-powered location suggestions coming soon</Text>
            </View>

            {/* Generate Itinerary Button */}
            <TouchableOpacity
                className="bg-blue-500 px-4 py-3 rounded-lg mb-6 items-center"
                onPress={() => console.log('Generate itinerary pressed')}
            >
                <Text className="text-white font-semibold">Generate Itinerary</Text>
            </TouchableOpacity>

            {/* Daily Itinerary Sections */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {days.map((day) => (
                    <View key={day.date.toISOString()} className="mb-6">
                        <View className="bg-gray-50 rounded-lg p-4">
                            <Text className="text-lg font-semibold text-gray-800 mb-2">
                                Day {day.dayNumber} - {day.date.toLocaleDateString('en-US', {
                                    weekday: 'long'
                                })} {day.date.toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                            <View className="bg-white rounded-lg p-4 border border-gray-200 min-h-[100px]">
                                <Text className="text-gray-500 text-center">
                                    Activities for this day will appear here
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
