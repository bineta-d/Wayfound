import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTripActivitiesGroupedByDay, Activity as TripActivity } from '../../../lib/TripService';

interface ItineraryScreenProps {
    tripId: string;
    startDate: string;
    endDate: string;
}

export default function ItineraryScreen({ tripId, startDate, endDate }: ItineraryScreenProps) {
    const router = useRouter();

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
            return () => {};
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
                                {(() => {
                                    const isoDate = toLocalISODate(day.date);
                                    const activities = groupedActivities[isoDate] || [];

                                    if (activities.length === 0) {
                                        return (
                                            <Text className="text-gray-500 text-center">
                                                Tap to add activities
                                            </Text>
                                        );
                                    }

                                    return (
                                        <View>
                                            {activities.slice(0, 3).map((activity) => (
                                                <Text
                                                    key={activity.id}
                                                    className="text-gray-800 mb-1"
                                                >
                                                    • {formatActivitySummary(activity)}
                                                </Text>
                                            ))}
                                            {activities.length > 3 && (
                                                <Text className="text-gray-500 text-sm mt-1">
                                                    + {activities.length - 3} more
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })()}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
