import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { getTripActivitiesGroupedByDay, Activity as TripActivity } from '../../../lib/TripService';

interface ItineraryScreenProps {
    tripId: string;
    startDate: string;
    endDate: string;
}

export default function ItineraryScreen({ tripId, startDate, endDate }: ItineraryScreenProps) {
    const router = useRouter();

    const [groupedActivities, setGroupedActivities] = useState<Record<string, TripActivity[]>>({});

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

    return (
        <View className="bg-neutral-background px-6 py-6 mb-2">
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
