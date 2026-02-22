import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

    const formatTimeRange = (
        start: string | null | undefined,
        end: string | null | undefined
    ) => {
        const s = start ? start.slice(0, 5) : '';
        const e = end ? end.slice(0, 5) : '';
        if (s && e) return `${s}–${e}`;
        if (s) return s;
        if (e) return `Ends ${e}`;
        return '';
    };

    const formatActivitySummary = (activity: TripActivity) => {
        const rawLocation = activity.location_name ?? '';
        const shortLocation = rawLocation ? rawLocation.split(',')[0].trim() : '';
        const title = (activity.title ?? '').trim();

        let base = '';
        if (shortLocation && title) base = `${shortLocation} - ${title}`;
        else if (shortLocation) base = shortLocation;
        else if (title) base = title;
        else base = 'Activity';

        const time = formatTimeRange(activity.start_time, activity.end_time);
        return time ? `${time} • ${base}` : base;
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
                activeOpacity={0.9}
                className="mb-6"
                onPress={() => console.log('Generate itinerary pressed')}
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

                            <View className="bg-neutral-surface rounded-lg p-4 border border-neutral-divider min-h-[100px]">
                                {(() => {
                                    const isoDate = toLocalISODate(day.date);
                                    const activities = groupedActivities[isoDate] || [];

                                    if (activities.length === 0) {
                                        return (
                                            <Text className="text-neutral-textSecondary text-center">Tap to add activities</Text>
                                        );
                                    }

                                    return (
                                        <View>
                                            {activities.slice(0, 3).map((activity) => (
                                                <Text key={activity.id} className="text-neutral-textPrimary mb-1">
                                                    • {formatActivitySummary(activity)}
                                                </Text>
                                            ))}
                                            {activities.length > 3 && (
                                                <Text className="text-neutral-textSecondary text-sm mt-1">
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
