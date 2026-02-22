
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { getTripActivitiesGroupedByDay, Activity as TripActivity } from '../../../lib/TripService';

//New imports
import { generateTripPlan } from '@/lib/ai';


interface ItineraryScreenProps {
    tripId: string;
    startDate: string;
    endDate: string;
    destination: string;
}

export default function ItineraryScreen({ tripId, startDate, endDate, destination }: ItineraryScreenProps) {
    const router = useRouter();
    const [aiItinerary, setAiItinerary] = useState<string[]>([]);
    const [loadingAI, setLoadingAI] = useState(false);


    const [groupedActivities, setGroupedActivities] = useState<Record<string, TripActivity[]>>({});

    const loadGroupedActivities = async () => {
        if (!tripId) return;
        try {
            const grouped = await getTripActivitiesGroupedByDay(tripId);
            setGroupedActivities(grouped);
        } catch (e) {
            console.log('Error loading grouped activities:', e);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadGroupedActivities();
            return () => { };
        }, [tripId])
    );

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

    const toLocalISODate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const formatActivitySummary = (activity: TripActivity) => {
        const rawLocation = activity.location_name ?? '';
        const shortLocation = rawLocation ? rawLocation.split(',')[0].trim() : '';
        const title = (activity.title ?? '').trim();

        if (shortLocation && title) return `${shortLocation} - ${title}`;
        if (shortLocation) return shortLocation;
        if (title) return title;
        return 'Activity';
    };

    const handleDayPress = (dayNumber: number) => {
        router.push(`/trip/${tripId}/day-detail?day=${dayNumber}`);
    };

    return (
        <View className="bg-neutral-background px-6 py-6 mb-2">
            <Text className="text-xl font-bold text-neutral-textPrimary mb-4">Itinerary</Text>

            {/* Map Card */}
            <View className="bg-neutral-divider rounded-lg h-32 items-center justify-center mb-4">
                <Text className="text-neutral-textSecondary text-center mb-2">🗺️</Text>
                <Text className="text-neutral-textPrimary text-center font-medium">Trip Map</Text>
                <Text className="text-neutral-textSecondary text-sm">AI-powered location suggestions coming soon</Text>
            </View>

            {/* Generate Itinerary Button */}
            <TouchableOpacity
                className="bg-blue-500 px-4 py-3 rounded-lg mb-6 items-center"
                onPress={async () => {
                    try {
                        setLoadingAI(true);

                        const result = await generateTripPlan({
                            destination: destination,
                            duration: days.length,
                            budget: 1500,
                            preferences: ["food", "culture", "exploring"],
                        });

                        console.log("AI RESULT:", result);

                        setAiItinerary(result.itinerary);
                        setLoadingAI(false);

                    } catch (err) {
                        console.log("AI ERROR:", err);
                        setLoadingAI(false);
                    }
                }}

            >
                <LinearGradient
                    colors={['#D81E5B', '#FF4D4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 12 }}
                >
                    <View className="px-4 py-3 rounded-lg items-center">
                        <Text className="text-white font-semibold">Generate Itinerary</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            {loadingAI && (
                <Text className="text-blue-500 mb-4 font-semibold">
                    🤖 Generating AI itinerary...
                </Text>
            )}


            {/* Daily Itinerary Sections */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {days.map((day) => (
                    <TouchableOpacity
                        key={day.date.toISOString()}
                        className="mb-6"
                        onPress={() => handleDayPress(day.dayNumber)}
                    >
                        <View className="bg-neutral-surface rounded-lg p-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-lg font-semibold text-neutral-textPrimary">
                                    Day {day.dayNumber} - {day.date.toLocaleDateString('en-US', {
                                        weekday: 'long'
                                    })}{' '}
                                    {day.date.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#67717B" />
                            </View>
                            <View className="bg-white rounded-lg p-4 border border-gray-200 min-h-[100px]">
                                {aiItinerary[day.dayNumber - 1] ? (
                                    <Text className="text-gray-800">
                                        {aiItinerary[day.dayNumber - 1]}
                                    </Text>
                                ) : (
                                    <Text className="text-gray-500 text-center">
                                        Tap to add activities
                                    </Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity >
                ))
                }
            </ScrollView >
        </View >
    );
}
