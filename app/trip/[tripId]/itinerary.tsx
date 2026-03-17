import { deleteItinerary } from "@/lib/itineraryService";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, LogBox, Text, TouchableOpacity, View } from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
} from "react-native-draggable-flatlist";
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

  useEffect(() => {
    LogBox.ignoreLogs([
      "Warning: ref.measureLayout must be called with a ref to a native component.",
      "ref.measureLayout must be called with a ref to a native component.",
      "measureLayout must be called with a ref to a native component",
    ]);

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args
        .map((arg) => (typeof arg === "string" ? arg : ""))
        .join(" ");

      if (message.includes("measureLayout must be called with a ref to a native component")) {
        return;
      }

      originalConsoleError(...args);
    };

    console.warn = (...args: any[]) => {
      const message = args
        .map((arg) => (typeof arg === "string" ? arg : ""))
        .join(" ");

      if (message.includes("measureLayout must be called with a ref to a native component")) {
        return;
      }

      originalConsoleWarn(...args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const handleDeleteItinerary = async () => {
    Alert.alert(
      "Delete itinerary",
      "Are you sure you want to delete the generated itinerary?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItinerary(tripId);
              console.log("Itinerary deleted");

              //Alert.alert("Itinerary deleted");
              router.replace(`/trip/${tripId}` as any);

            } catch (error) {
              console.log("Delete error", error);
              Alert.alert("Failed to delete itinerary");
            }
          },
        },
      ]
    );
  };


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

  const hasItinerary = 
    Object.values(dayActivities).some((activities) => activities.length > 0) || 
    aiItinerary?.length > 0;

  const handleDayPress = (dayNumber: number) => {
    router.push(`/trip/${tripId}/day-detail?day=${dayNumber}`);
  };

  const listHeader = (
    <View className="px-6 pt-0">
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

      {/* Delete Itinerary Button */}
      {hasItinerary && (
        <TouchableOpacity
          activeOpacity={0.9}
          className="mb-6 w-full"
          onPress={handleDeleteItinerary}
        >
          <View className="bg-red-500 px-4 py-3 rounded-lg items-center flex-row justify-center">
            <MaterialIcons name="delete" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Delete Itinerary
            </Text>
          </View>
        </TouchableOpacity>
      )}

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
    </View>
  );

  return (
    <NestableScrollContainer
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="mb-0 px-6" collapsable={false}>
        <TripMap
          tripId={tripId}
          startDate={startDate}
          endDate={endDate}
          destination={destination}
          activities={mapActivities}
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

        {/* Delete Itinerary Button */}
        {hasItinerary && (
          <TouchableOpacity
            activeOpacity={0.9}
            className="mb-6 w-full"
            onPress={handleDeleteItinerary}
          >
            <View className="bg-red-500 px-4 py-3 rounded-lg items-center flex-row justify-center">
              <MaterialIcons name="delete" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Delete Itinerary
              </Text>
            </View>
          </TouchableOpacity>
        )}

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
          <View collapsable={false} style={{ minHeight: 1 }}>
            <NestableDraggableFlatList
            data={days}
            keyExtractor={(day) => String(day.id ?? day.itineraryDayId ?? `day-${day.dayNumber}`)}
            scrollEnabled={false}
            activationDistance={10}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item: day, drag: dragDay, isActive: isDayActive }) => (
              <View
                className="mb-6"
                style={{ opacity: isDayActive ? 0.95 : 1 }}
                collapsable={false}
              >
                <View className="bg-neutral-surface rounded-lg p-4" collapsable={false}>
                  <View
                    className="flex-row justify-between items-center mb-2"
                    collapsable={false}
                  >
                    <TouchableOpacity
                      onPress={() => onToggleDayCollapse(day.dayNumber)}
                      activeOpacity={0.8}
                      className="flex-1"
                    >
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
                    </TouchableOpacity>

                    <View className="flex-row items-center ml-3">
                      <TouchableOpacity
                        onLongPress={dragDay}
                        delayLongPress={120}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="mr-2 p-1"
                      >
                        <Ionicons name="reorder-four" size={18} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onToggleDayCollapse(day.dayNumber)}
                        className="p-1"
                      >
                        <Ionicons
                          name={
                            collapsedDays[day.dayNumber]
                              ? "chevron-down"
                              : "chevron-up"
                          }
                          size={20}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDayPress(day)}
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
                      ) : dedupeActivities(day.activities ?? []).length > 0 ? (
                        <View collapsable={false} style={{ minHeight: 1 }}>
                          <Text className="text-sm text-neutral-textSecondary mb-3">
                            {dedupeActivities(day.activities ?? []).length} activities
                          </Text>
                          <NestableDraggableFlatList
                            data={sortActivitiesForDisplay(
                              dedupeActivities(day.activities ?? []),
                            )}
                            keyExtractor={(item, index) => `${day.dayNumber}-${item.id}-${index}`}
                            scrollEnabled={false}
                            activationDistance={8}
                            renderItem={({ item, drag, isActive }: RenderItemParams<TripActivity>) => (
                              <View collapsable={false}>
                                <TouchableOpacity
                                  activeOpacity={0.9}
                                  className="bg-white rounded-lg p-3 border border-neutral-divider mb-2"
                                  onPress={() => handleDayPress(day)}
                                  style={{ opacity: isActive ? 0.9 : 1 }}
                                >
                                  <View className="flex-row justify-between items-center" collapsable={false}>
                                    <View className="flex-1" collapsable={false}>
                                      <Text className="font-medium text-neutral-textPrimary">
                                        {item.location_name
                                          ? item.location_name.split(",")[0].trim()
                                          : "Unknown Location"}
                                      </Text>
                                    </View>
                                    <TouchableOpacity
                                      onLongPress={drag}
                                      delayLongPress={120}
                                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                      className="ml-3 p-2"
                                    >
                                      <Ionicons
                                        name="reorder-four"
                                        size={16}
                                        color={isActive ? "#3B82F6" : "#6B7280"}
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </TouchableOpacity>
                              </View>
                            )}
                            onDragEnd={({ data }) => {
                              setLocalDayBlocks((prev) =>
                                prev.map((block) =>
                                  block.dayNumber === day.dayNumber
                                    ? { ...block, activities: data }
                                    : block,
                                ),
                              );
                              onReorderDayActivities?.(day.dayNumber, data);
                            }}
                          />
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
                </View>
              </View>
            )}
            onDragEnd={({ data }) => {
              const normalized = data.map((day, index) => ({
                ...day,
                dayNumber: index + 1,
                position: index + 1,
              }));
              setLocalDayBlocks(normalized);
              onReorderDays?.(normalized);
            }}
            />
          </View>
        )}
      </View>
    </NestableScrollContainer>
  );
}
