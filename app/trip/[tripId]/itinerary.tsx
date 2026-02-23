import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { PanResponder, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Activity as TripActivity } from "../../../lib/TripService";

interface ItineraryProps {
    tripId: string;
    startDate: string;
    endDate: string;
    aiItinerary: string[];
    onToggleDayCollapse: (dayNumber: number) => void;
    onToggleItineraryCollapse: () => void;
    collapsedDays: Record<number, boolean>;
    isItineraryCollapsed: boolean;
    dayActivities: Record<number, TripActivity[]>;
    loadingActivities: Record<number, boolean>;
}

export default function Itinerary({
    tripId,
    startDate,
    endDate,
    aiItinerary,
    onToggleDayCollapse,
    onToggleItineraryCollapse,
    collapsedDays,
    isItineraryCollapsed,
    dayActivities,
    loadingActivities,
}: ItineraryProps) {
    const router = useRouter();
    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    const createPanResponder = (index: number) => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setDraggedItem(index);
                console.log('Start dragging item:', index);
            },
            onPanResponderMove: () => {
                // Handle drag movement
            },
            onPanResponderRelease: () => {
                setDraggedItem(null);
                console.log('End dragging item:', index);
            },
        });
    };

    const generateDayHeaders = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];
        const current = new Date(start);

        while (current <= end) {
            days.push({
                date: new Date(current),
                dayNumber: days.length + 1,
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
        <View className="bg-neutral-background px-6 py-6 mb-2">
            <Text className="text-xl font-bold text-neutral-textPrimary mb-4">Reservations</Text>

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
                    <View className="bg-pink-100 p-3 rounded-full mb-1">
                        <Ionicons name="ticket" size={20} color="#EC4899" />
                    </View>
                    <Text className="text-xs text-neutral-textSecondary">Activities</Text>
                </TouchableOpacity>
            </ScrollView>

            <Text className="text-xl font-bold text-neutral-textPrimary mb-4">Itinerary</Text>

            {/* Trip Map */}
            <View className="rounded-lg overflow-hidden mb-4 border border-neutral-divider bg-neutral-surface">
                <View className="px-4 py-3 border-b border-neutral-divider">
                    <Text className="text-neutral-textPrimary font-semibold">Trip Map</Text>
                    <Text className="text-neutral-textSecondary text-xs mt-1">
                        {mapActivities.length > 0 ? `${mapActivities.length} pinned activities` : 'No pinned activities yet'}
                    </Text>
                </View>

                <View style={{ height: 180 }}>
                    {mapActivities.length === 0 ? (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-neutral-textSecondary">Add a location to pin activities</Text>
                        </View>
                    ) : (
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            initialRegion={computeRegion()}
                        >
                            {mapActivities.map((a) => (
                                <Marker
                                    key={a.id}
                                    coordinate={{
                                        latitude: a.latitude as number,
                                        longitude: a.longitude as number
                                    }}
                                >
                                    <Callout onPress={() => handleMarkerNavigate(a)}>
                                        <View style={{ maxWidth: 220 }}>
                                            <Text style={{ fontWeight: '600' }}>
                                                {(a.location_name ?? 'Activity').split(',')[0]}
                                            </Text>
                                            {a.title ? (
                                                <Text style={{ marginTop: 4, color: '#67717B' }}>{a.title}</Text>
                                            ) : null}
                                            <Text style={{ marginTop: 6, color: '#3A1FA8', fontWeight: '600' }}>
                                                Open activity details
                                            </Text>
                                        </View>
                                    </Callout>
                                </Marker>
                            ))}
                        </MapView>
                    )}
                </View>
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

                {Object.values(groupedActivities).flat().length === 0 ? (
                    <Text className="text-neutral-textSecondary text-sm mb-3">
                        No activities added yet. Add places you want to visit during your trip
                    </Text>
                ) : (
                    <View className="space-y-2">
                        {Object.values(groupedActivities).flat().map((activity, index) => (
                            <View key={activity.id || index} className="bg-neutral-background p-3 rounded-lg">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-neutral-textPrimary flex-1">
                                        {activity.location_name || 'Unknown Location'}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            // TODO: Open day assignment modal
                                            console.log('Assign to day:', activity);
                                        }}
                                        className="ml-2"
                                    >
                                        <Ionicons name="calendar" size={16} color="#3B82F6" />
                                    </TouchableOpacity>
                                </View>
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

            {/* Google Places Modal */}
            {showAddSpotModal && (
                <View className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center z-50">
                    <View className="bg-white rounded-lg p-6 m-4 w-80 shadow-lg border border-neutral-divider">
                        <Text className="text-lg font-semibold text-neutral-textPrimary mb-4">Add Target Spot</Text>

                        <TextInput
                            className="border border-neutral-divider rounded-lg p-3 mb-4"
                            placeholder="Search for a place..."
                            value={newSpotName}
                            onChangeText={setNewSpotName}
                        />

                        <View className="space-y-2">
                            {googlePlaces.slice(0, 3).map((place, index) => (
                                <TouchableOpacity
                                    key={index}
                                    className="bg-neutral-surface p-3 rounded-lg"
                                    onPress={() => setNewSpotName(place.description || place.name)}
                                >
                                    <Text className="text-neutral-textPrimary">{place.description || place.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row space-x-3">
                            <TouchableOpacity
                                className="flex-1 bg-gray-200 rounded-lg p-3"
                                onPress={() => setShowAddSpotModal(false)}
                            >
                                <Text className="text-gray-600 text-center font-medium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-blue-500 rounded-lg p-3"
                                onPress={() => {
                                    if (newSpotName.trim()) {
                                        // TODO: Add to unassigned activities (no day assigned)
                                        console.log('New spot via Google Places:', newSpotName);
                                    }
                                    setShowAddSpotModal(false);
                                    setNewSpotName('');
                                    setGooglePlaces([]);
                                }}
                            >
                                <Text className="text-white text-center font-medium">Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}


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
                            <View key={day.date.toISOString()} className="mb-6">
                                <TouchableOpacity
                                    onPress={() => onToggleDayCollapse(day.dayNumber)}
                                    className="bg-neutral-surface rounded-lg p-4"
                                >
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-lg font-semibold text-neutral-textPrimary">
                                            Day {day.dayNumber} -{" "}
                                            {day.date.toLocaleDateString("en-US", {
                                                weekday: "long",
                                            })}{" "}
                                            {day.date.toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </Text>
                                        <View className="flex-row items-center">
                                            <Ionicons
                                                name={
                                                    collapsedDays[day.dayNumber]
                                                        ? "chevron-down"
                                                        : "chevron-up"
                                                }
                                                size={20}
                                                color="#6B7280"
                                            />
                                            <TouchableOpacity
                                                onPress={() => handleDayPress(day.dayNumber)}
                                                className="ml-3"
                                            >
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={20}
                                                    color="#67717B"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {!collapsedDays[day.dayNumber] && (
                                        <View className="bg-neutral-background rounded-lg p-4 border border-neutral-divider">
                                            {loadingActivities[day.dayNumber] ? (
                                                <Text className="text-neutral-textSecondary text-center py-4">
                                                    Loading activities...
                                                </Text>
                                            ) : dayActivities[day.dayNumber] &&
                                                dayActivities[day.dayNumber].length > 0 ? (
                                                <View className="space-y-3">
                                                    {dayActivities[day.dayNumber].map(
                                                        (activity, index) => (
                                                            <View
                                                                key={activity.id || index}
                                                                className="bg-white rounded-lg p-3 border border-neutral-divider"
                                                            >
                                                                <View className="flex-row justify-between items-start">
                                                                    <View className="flex-1">
                                                                        <Text className="font-medium text-neutral-textPrimary mb-1">
                                                                            {activity.title || "Untitled Activity"}
                                                                        </Text>
                                                                        <Text className="text-sm text-neutral-textSecondary mb-1">
                                                                            {activity.location_name}
                                                                        </Text>
                                                                        {activity.start_time && (
                                                                            <Text className="text-xs text-neutral-textTertiary">
                                                                                {activity.start_time} -{" "}
                                                                                {activity.end_time || "TBD"}
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                    <TouchableOpacity
                                                                        onPress={() =>
                                                                            handleDayPress(day.dayNumber)
                                                                        }
                                                                        className="ml-2"
                                                                    >
                                                                        <Ionicons
                                                                            name="create"
                                                                            size={16}
                                                                            color="#6B7280"
                                                                        />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        ),
                                                    )}
                                                </View>
                                            ) : aiItinerary[day.dayNumber - 1] ? (
                                                <Text className="text-neutral-textPrimary">
                                                    {aiItinerary[day.dayNumber - 1]}
                                                </Text>
                                            ) : (
                                                <Text className="text-neutral-textSecondary text-center py-4">
                                                    Tap to add activities
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
            );
}