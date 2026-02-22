
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
    const [targetSpots, setTargetSpots] = useState<string[]>([]);
    const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});
    const [isItineraryCollapsed, setIsItineraryCollapsed] = useState(false);

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

    const toggleDayCollapse = (dayNumber: number) => {
        setCollapsedDays(prev => ({
            ...prev,
            [dayNumber]: !prev[dayNumber]
        }));
    };

    const toggleItineraryCollapse = () => {
        setIsItineraryCollapsed(!isItineraryCollapsed);
    };

    const addTargetSpot = (spot: string) => {
        if (spot.trim()) {
            setTargetSpots(prev => [...prev, spot.trim()]);
        }
    };

    const removeTargetSpot = (index: number) => {
        setTargetSpots(prev => prev.filter((_, i) => i !== index));
    };

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
            {/* Reservation Icons */}
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
                    <View className="bg-indigo-100 p-3 rounded-full mb-1">
                        <Ionicons name="restaurant" size={20} color="#6366F1" />
                    </View>
                    <Text className="text-xs text-neutral-textSecondary">Dining</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center mr-6">
                    <View className="bg-pink-100 p-3 rounded-full mb-1">
                        <Ionicons name="ticket" size={20} color="#EC4899" />
                    </View>
                    <Text className="text-xs text-neutral-textSecondary">Activities</Text>
                </TouchableOpacity>
            </ScrollView>

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
                className="mb-6 w-full"
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

            {/* Target Spots Section */}
            <View className="bg-neutral-surface rounded-lg p-4 mb-6">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-semibold text-neutral-textPrimary">Target Spots</Text>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name="add-circle" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {targetSpots.length === 0 ? (
                    <Text className="text-neutral-textSecondary text-sm mb-3">
                        Add places you want to visit during your trip
                    </Text>
                ) : (
                    <View className="space-y-2">
                        {targetSpots.map((spot, index) => (
                            <View key={index} className="flex-row justify-between items-center bg-neutral-background p-3 rounded-lg">
                                <Text className="text-neutral-textPrimary flex-1">• {spot}</Text>
                                <TouchableOpacity onPress={() => removeTargetSpot(index)}>
                                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3"
                    onPress={() => {
                        // Simple add spot functionality - you can replace with modal later
                        const spot = prompt("Add a target spot:");
                        if (spot) addTargetSpot(spot);
                    }}
                >
                    <Text className="text-blue-600 text-center font-medium">+ Add Target Spot</Text>
                </TouchableOpacity>
            </View>



            {/* Daily Itinerary Sections */}
            <View className="mb-4">
                <TouchableOpacity
                    onPress={toggleItineraryCollapse}
                    className="flex-row justify-between items-center mb-4"
                >
                    <Text className="text-lg font-semibold text-neutral-textPrimary">Daily Itinerary</Text>
                    <Ionicons
                        name={isItineraryCollapsed ? "chevron-down" : "chevron-up"}
                        size={20}
                        color="#6B7280"
                    />
                </TouchableOpacity>

                {!isItineraryCollapsed && (
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
                                        {aiItinerary[day.dayNumber - 1] ? (
                                            <Text className="text-neutral-textPrimary">
                                                {aiItinerary[day.dayNumber - 1]}
                                            </Text>
                                        ) : (
                                            <Text className="text-neutral-textSecondary text-center">
                                                Tap to add activities
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
