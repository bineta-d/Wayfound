import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Activity as TripActivity } from "../../../lib/TripService";
import TripMap from "./trip-map";
interface ItineraryProps {
  tripId: string;
  startDate: string;
  endDate: string;
  aiItinerary: string[];
  destination: string;
  onToggleDayCollapse: (dayNumber: number) => void;
  onToggleItineraryCollapse: () => void;
  collapsedDays: Record<number, boolean>;
  isItineraryCollapsed: boolean;
  dayActivities: Record<number, TripActivity[]>;
  loadingActivities: Record<number, boolean>;
}

export default function ItineraryScreen({
  tripId,
  startDate,
  endDate,
  destination,
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
        console.log("Start dragging item:", index);
      },
      onPanResponderMove: () => {
        // Handle drag movement
      },
      onPanResponderRelease: () => {
        setDraggedItem(null);
        console.log("End dragging item:", index);
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
    <View className="mb-0 px-6">
      <TripMap
        tripId={tripId}
        startDate={startDate}
        endDate={endDate}
        destination={destination}
        activities={Object.values(dayActivities).flat()}
        onMarkerNavigate={(activity) => {
          router.push(`/trip/${tripId}/day-detail?activityId=${activity.id}`);
        }}
      />

      {/* Generate Itinerary Button (same as overview) */}
      <TouchableOpacity
        activeOpacity={0.9}
        className="mb-6 w-full"
        onPress={() => {
          router.push(
            `/ai-planner?tripId=${tripId}&destination=${encodeURIComponent(destination)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
          );
        }}
      >
        <LinearGradient
          colors={["#D81E5B", "#FF4D4D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="px-4 py-3 rounded-lg items-center flex-row justify-center">
            <MaterialIcons name="auto-awesome" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Generate Itinerary
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

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
                      onPress={() =>
                        router.push(
                          `/trip/${tripId}/day-detail?day=${day.dayNumber}`,
                        )
                      }
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
                      <View className="space-y-2">
                        <Text className="text-sm text-neutral-textSecondary mb-3">
                          {dayActivities[day.dayNumber].length} activities
                        </Text>
                        {dayActivities[day.dayNumber].map((activity, index) => {
                          const panResponder = createPanResponder(index);
                          return (
                            <TouchableOpacity
                              key={activity.id || index}
                              className="bg-white rounded-lg p-3 border border-neutral-divider mb-2"
                              onPress={() =>
                                router.push(
                                  `/trip/${tripId}/day-detail?day=${day.dayNumber}`,
                                )
                              }
                            >
                              <View className="flex-row justify-between items-center">
                                <View className="flex-1">
                                  <Text className="font-medium text-neutral-textPrimary">
                                    {activity.location_name
                                      ? activity.location_name
                                          .split(",")[0]
                                          .trim()
                                      : "Unknown Location"}
                                  </Text>
                                </View>
                                <View
                                  {...panResponder.panHandlers}
                                  className="ml-3 p-2"
                                >
                                  <Ionicons
                                    name="reorder-four"
                                    size={16}
                                    color={
                                      draggedItem === index
                                        ? "#3B82F6"
                                        : "#6B7280"
                                    }
                                  />
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
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
