
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { getTripActivitiesForDay } from '../../../lib/TripService';

//New imports
import { generateTripPlan } from '@/lib/ai';

import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { getTripActivitiesGroupedByDay, Activity as TripActivity } from '../../../lib/TripService';

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
    const [dayActivities, setDayActivities] = useState<Record<number, TripActivity[]>>({});
    const [loadingActivities, setLoadingActivities] = useState<Record<number, boolean>>({});

    const [groupedActivities, setGroupedActivities] = useState<Record<string, TripActivity[]>>({});

    const loadDayActivities = async (dayNumber: number) => {
        if (!tripId) return;
        setLoadingActivities(prev => ({ ...prev, [dayNumber]: true }));
        try {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
            const dateStr = dayDate.toISOString().split('T')[0];
            const activities = await getTripActivitiesForDay(tripId, dateStr);
            setDayActivities(prev => ({ ...prev, [dayNumber]: activities }));
        } catch (e) {
            console.log(`Error loading day ${dayNumber} activities:`, e);
        } finally {
            setLoadingActivities(prev => ({ ...prev, [dayNumber]: false }));
        }
        const allActivities = Object.values(groupedActivities).flat();
        const mapActivities = allActivities.filter(
            (a) => typeof a.latitude === 'number' && typeof a.longitude === 'number'
        );

        const computeRegion = (): Region => {
            if (mapActivities.length === 0) {
                return {
                    latitude: 25.7617,
                    longitude: -80.1918,
                    latitudeDelta: 0.15,
                    longitudeDelta: 0.15
                };
            }

            const lats = mapActivities.map((a) => a.latitude as number);
            const lngs = mapActivities.map((a) => a.longitude as number);

            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            const latitude = (minLat + maxLat) / 2;
            const longitude = (minLng + maxLng) / 2;

            // padding
            const latitudeDelta = Math.max(0.02, (maxLat - minLat) * 1.6);
            const longitudeDelta = Math.max(0.02, (maxLng - minLng) * 1.6);

            return { latitude, longitude, latitudeDelta, longitudeDelta };
        };

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

        useFocusEffect(
            React.useCallback(() => {
                // Set default collapse state: all days uncollapsed except today
                const today = new Date();
                const defaultCollapsed: Record<number, boolean> = {};
                days.forEach(day => {
                    const dayDate = new Date(day.date);
                    const isCurrentDay = dayDate.toDateString() === today.toDateString();
                    defaultCollapsed[day.dayNumber] = isCurrentDay; // Only today is collapsed
                });
                setCollapsedDays(defaultCollapsed);
                return () => { };
            }, [tripId, startDate])
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

        useEffect(() => {
            // Load activities for all days when component mounts
            days.forEach(day => {
                loadDayActivities(day.dayNumber);
            });

            // Set default collapse state: all days uncollapsed except current day
            const today = new Date();
            const defaultCollapsed: Record<number, boolean> = {};
            days.forEach(day => {
                const dayDate = new Date(day.date);
                const isCurrentDay = dayDate.toDateString() === today.toDateString();
                defaultCollapsed[day.dayNumber] = false;
            });
            setCollapsedDays(defaultCollapsed);
        }, [tripId, startDate]);

        const toLocalISODate = (d: Date) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const parseISODateLocal = (iso: string): Date | null => {
            // Expect YYYY-MM-DD (may be part of a longer ISO string)
            const m = (iso ?? '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!m) return null;
            const y = Number(m[1]);
            const mo = Number(m[2]) - 1;
            const d = Number(m[3]);
            const dt = new Date(y, mo, d);
            dt.setHours(0, 0, 0, 0);
            return dt;
        };

        const getDayNumberForActivity = (activity: TripActivity): number | null => {
            const dayDate = activity.day_date;
            if (!dayDate) return null;
            const act = parseISODateLocal(dayDate);
            const start = parseISODateLocal(startDate);
            if (!act || !start) return null;
            const diffDays = Math.round((act.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 ? diffDays + 1 : null;
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

        const isActivityAssignedToThisDay = (activity: TripActivity, dayDate: string) => {
            // Check if activity was added via day-detail page (has day_date)
            // and if it matches the current day being displayed
            return activity.day_date === dayDate;
        };

        const isTargetSpotActivity = (activity: TripActivity) => {
            // Check if activity has no day_date (unassigned)
            return !activity.day_date;
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

        const handleMarkerNavigate = (a: TripActivity) => {
            const dn = getDayNumberForActivity(a);
            if (dn) {
                handleDayPress(dn);
                return;
            }
            // Fallback: if day can't be computed, go to Day 1
            handleDayPress(1);
        };
        const toggleDayCollapse = (dayNumber: number) => {
            setCollapsedDays(prev => ({
                ...prev,
                [dayNumber]: !prev[dayNumber]
            }));
        };

        const toggleItineraryCollapse = () => {
            setIsItineraryCollapsed(!isItineraryCollapsed);
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
                                        onPress={() => toggleDayCollapse(day.dayNumber)}
                                        className="bg-neutral-surface rounded-lg p-4"
                                    >
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
                                            <View className="flex-row items-center">
                                                <Ionicons
                                                    name={collapsedDays[day.dayNumber] ? "chevron-down" : "chevron-up"}
                                                    size={20}
                                                    color="#6B7280"
                                                />
                                                <TouchableOpacity
                                                    onPress={() => handleDayPress(day.dayNumber)}
                                                    className="ml-3"
                                                >
                                                    <Ionicons name="chevron-forward" size={20} color="#67717B" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {!collapsedDays[day.dayNumber] && (
                                            <View className="bg-neutral-background rounded-lg p-4 border border-neutral-divider">
                                                {(() => {
                                                    const isoDate = toLocalISODate(day.date);
                                                    const activities = groupedActivities[isoDate] || [];

                                                    if (activities.length === 0) {
                                                        return (
                                                            <Text className="text-neutral-textSecondary text-center py-4">
                                                                Tap to add activities
                                                            </Text>
                                                        );
                                                    }

                                                    return (
                                                        <View className="space-y-3">
                                                            {activities.map((activity) => (
                                                                <View key={activity.id} className="bg-white rounded-lg p-3 border border-neutral-divider">
                                                                    <View className="flex-row justify-between items-start">
                                                                        <View className="flex-1">
                                                                            <Text className="font-medium text-neutral-textPrimary mb-1">
                                                                                {activity.title || 'Untitled Activity'}
                                                                            </Text>
                                                                            <Text className="text-sm text-neutral-textSecondary mb-1">
                                                                                {activity.location_name}
                                                                            </Text>
                                                                            {activity.start_time && (
                                                                                <Text className="text-xs text-neutral-textTertiary">
                                                                                    {activity.start_time} - {activity.end_time || 'TBD'}
                                                                                </Text>
                                                                            )}
                                                                        </View>
                                                                        <TouchableOpacity
                                                                            onPress={() => handleDayPress(day.dayNumber)}
                                                                            className="ml-2"
                                                                        >
                                                                            <Ionicons name="create" size={16} color="#6B7280" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    );
                                                })()}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        );
        return (
            <View>
                {activities.slice(0, 3).map((activity) => (
                    <Text key={activity.id} className="text-neutral-textPrimary mb-1">
                        • {formatActivitySummary(activity)}
                    </Text>
                ))}
                {activities.length > 3 && (
                    <Text className="text-neutral-textSecondary text-sm">
                        {isoDate}
                        {isActivityAssignedToThisDay(activities[0], isoDate) && (
                            <Text className="text-green-600 ml-2">• Assigned to this day</Text>
                        )}
                        + {activities.length - 3} more
                    </Text>
                )}
            </View>
        );
    })()
}
                                        </View >
                                </View >
                    </TouchableOpacity >
                    ))}
                </ScrollView >
            </View >
        );
{
    !collapsedDays[day.dayNumber] && (
        <View className="bg-neutral-background rounded-lg p-4 border border-neutral-divider">
            {loadingActivities[day.dayNumber] ? (
                <Text className="text-neutral-textSecondary text-center py-4">
                    Loading activities...
                </Text>
            ) : dayActivities[day.dayNumber] && dayActivities[day.dayNumber].length > 0 ? (
                <View className="space-y-3">
                    {dayActivities[day.dayNumber].map((activity, index) => (
                        <View key={activity.id || index} className="bg-white rounded-lg p-3 border border-neutral-divider">
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <Text className="font-medium text-neutral-textPrimary mb-1">
                                        {activity.title || 'Untitled Activity'}
                                    </Text>
                                    <Text className="text-sm text-neutral-textSecondary mb-1">
                                        {activity.location_name}
                                    </Text>
                                    {activity.start_time && (
                                        <Text className="text-xs text-neutral-textTertiary">
                                            {activity.start_time} - {activity.end_time || 'TBD'}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDayPress(day.dayNumber)}
                                    className="ml-2"
                                >
                                    <Ionicons name="create" size={16} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
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
    )
}
                                    </TouchableOpacity >
                                </View >
                            ))
}
                        </ScrollView >
                    )}
                </View >
            </View >
        );
    }
}