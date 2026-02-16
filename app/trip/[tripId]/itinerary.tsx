import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from "expo-router";


interface ItineraryScreenProps {
    tripId?: string;
    startDate?: string;
    endDate?: string;
    destination?: string;
}

export default function ItineraryScreen(props: ItineraryScreenProps) {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Priority: props -> params
    const tripId = props.tripId || (params.tripId as string);
    const startDate = props.startDate || (params.startDate as string);
    const endDate = props.endDate || (params.endDate as string);
    const destination = props.destination || (params.destination as string);
    

    const [aiItinerary, setAiItinerary] = useState<string[]>([]);

    // Load AI from Query Params
    useEffect(() => {
        if (params.ai && typeof params.ai === "string") {
            try {
                const parsed = JSON.parse(params.ai as string);
                setAiItinerary(parsed);
                console.log("Loaded AI itinerary:", parsed);
            } catch (e) {
                console.log("Parse error", e);
            }
        }
    }, [params.ai]);



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

    const handleDayPress = (dayNumber: number) => {
        router.push(`/trip/${tripId}/day-detail?day=${dayNumber}`);
    };

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
                onPress={() => {
                    router.push(
                         `/ai-planner?tripId=${tripId}&destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}` as any
                    );
                }}
            >
                <Text className="text-white font-semibold">Generate with AI ✨</Text>
            </TouchableOpacity>


            {/* Daily Itinerary Sections */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {days.map((day) => (
                    <TouchableOpacity
                        key={day.date.toISOString()}
                        className="mb-6"
                        onPress={() => handleDayPress(day.dayNumber)}
                    >
                        <View className="bg-gray-50 rounded-lg p-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-lg font-semibold text-gray-800">
                                    Day {day.dayNumber} - {day.date.toLocaleDateString('en-US', {
                                        weekday: 'long'
                                    })} {day.date.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                            </View>
                            <View className="bg-white rounded-lg p-4 border border-gray-200 min-h-[100px]">
                                {/* Show AI if exists */}
                                {aiItinerary[day.dayNumber - 1] ? (
                                    <Text className="text-gray-800">
                                        {aiItinerary[day.dayNumber - 1]}
                                    </Text>
                                ) : (
                                    <Text className="text-gray-400 text-center">
                                        Tap to add activities
                                    </Text>
                                )}

                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}