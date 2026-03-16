import { deleteItinerary } from "@/lib/itineraryService";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
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
  onReorderDayActivities?: (dayNumber: number, reordered: TripActivity[]) => void;
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
  onReorderDayActivities,
}: ItineraryProps) {
  const router = useRouter();

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


  const generateDayHeaders = () => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
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

  const [localDayActivities, setLocalDayActivities] = useState<Record<number, TripActivity[]>>({});

  useEffect(() => {
    setLocalDayActivities(dayActivities);
  }, [dayActivities]);

  const sortActivitiesForDisplay = (items: TripActivity[]) => {
    return [...items].sort((a, b) => {
      const aPos = a.position ?? Number.MAX_SAFE_INTEGER;
      const bPos = b.position ?? Number.MAX_SAFE_INTEGER;
      if (aPos !== bPos) return aPos - bPos;

      const aTime = a.start_time?.slice(0, 5) ?? null;
      const bTime = b.start_time?.slice(0, 5) ?? null;
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;

      const t = aTime.localeCompare(bTime);
      if (t !== 0) return t;

      const aCreated = (a as any).created_at ?? "";
      const bCreated = (b as any).created_at ?? "";
      return aCreated.localeCompare(bCreated);
    });
  };

  const hasItinerary =
    Object.values(localDayActivities).some((activities) => activities.length > 0) ||
    aiItinerary?.length > 0;

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
        activities={Object.values(localDayActivities).flat()}
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {days.map((day) => (
            <View
              key={`${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(day.date.getDate()).padStart(2, "0")}`}
              className="mb-6"
            >
              <View className="bg-neutral-surface rounded-lg p-4">
              <TouchableOpacity
                  onPress={() => onToggleDayCollapse(day.dayNumber)}
                  activeOpacity={0.8}
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
                </TouchableOpacity>

                {!collapsedDays[day.dayNumber] && (
                  <View className="bg-neutral-background rounded-lg p-4 border border-neutral-divider">
                    {loadingActivities[day.dayNumber] ? (
                      <Text className="text-neutral-textSecondary text-center py-4">
                        Loading activities...
                      </Text>
                    ) : localDayActivities[day.dayNumber] &&
                      localDayActivities[day.dayNumber].length > 0 ? (
                      <View>
                        <Text className="text-sm text-neutral-textSecondary mb-3">
                          {localDayActivities[day.dayNumber].length} activities
                        </Text>
                        <DraggableFlatList
                          data={sortActivitiesForDisplay(localDayActivities[day.dayNumber])}
                          keyExtractor={(item) => item.id}
                          scrollEnabled={false}
                          activationDistance={8}
                          renderItem={({ item, drag, isActive }: RenderItemParams<TripActivity>) => (
                            <TouchableOpacity
                              activeOpacity={0.9}
                              className="bg-white rounded-lg p-3 border border-neutral-divider mb-2"
                              onPress={() =>
                                router.push(
                                  `/trip/${tripId}/day-detail?day=${day.dayNumber}`,
                                )
                              }
                              style={{ opacity: isActive ? 0.9 : 1 }}
                            >
                              <View className="flex-row justify-between items-center">
                                <View className="flex-1">
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
                          )}
                          onDragEnd={({ data }) => {
                            setLocalDayActivities((prev) => ({
                              ...prev,
                              [day.dayNumber]: data,
                            }));
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
          ))}
        </ScrollView>
      )}
    </View>
  );
}
