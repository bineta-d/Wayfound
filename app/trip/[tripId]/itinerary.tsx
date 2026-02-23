import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
        <View className="mb-4">
            <TouchableOpacity
                onPress={onToggleItineraryCollapse}
                className="flex-row justify-between items-center mb-4"
            >
                <Text className="text-lg font-semibold text-neutral-textPrimary">
                    Daily Itinerary
                </Text>
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
            </View >
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
}) ()
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