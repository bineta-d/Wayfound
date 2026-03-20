import { deleteItinerary } from "@/lib/itineraryService";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, LogBox, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Activity as TripActivity } from "../../../lib/TripService";
import TripMap from "./trip-map";
import Weather from "./Weather";

interface ItineraryProps {
  tripId: string;
  startDate: string;
  endDate: string;
  aiItinerary: string[];
  destination: string;
  itineraryDays: any[];
  onReorderDays?: (reorderedDays: any[]) => void;
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
  itineraryDays,
  onReorderDays,
  onToggleDayCollapse,
  onToggleItineraryCollapse,
  collapsedDays,
  isItineraryCollapsed,
  dayActivities,
  loadingActivities,
  onReorderDayActivities,
}: ItineraryProps) {
  const router = useRouter();
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [localDayBlocks, setLocalDayBlocks] = useState<any[]>([]);

  const generateDayHeaders = () => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const days: {
      id?: string;
      itineraryDayId?: string | null;
      date: Date;
      day_date: string;
      display_date: string;
      dayNumber: number;
      position?: number | null;
    }[] = [];
    const current = new Date(start);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      days.push({
        date: new Date(current),
        day_date: `${year}-${month}-${day}`,
        display_date: `${year}-${month}-${day}`,
        dayNumber: days.length + 1,
        itineraryDayId: null,
        position: days.length + 1,
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const sortActivitiesForDisplay = (items: TripActivity[]) => {
    return [...items].sort((a, b) => {
      const aPos = (a as any).position ?? Number.MAX_SAFE_INTEGER;
      const bPos = (b as any).position ?? Number.MAX_SAFE_INTEGER;
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

  const dedupeActivities = (items: TripActivity[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item?.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const activitiesByItineraryDayId = useMemo(() => {
    const map: Record<string, TripActivity[]> = {};

    Object.values(dayActivities)
      .flat()
      .forEach((activity) => {
        const itineraryDayId = activity?.itinerary_day_id;
        if (!itineraryDayId) return;
        if (!map[itineraryDayId]) {
          map[itineraryDayId] = [];
        }
        map[itineraryDayId].push(activity);
      });

    Object.keys(map).forEach((key) => {
      map[key] = sortActivitiesForDisplay(map[key]);
    });

    return map;
  }, [dayActivities]);

  const activitiesByDayDate = useMemo(() => {
    const map: Record<string, TripActivity[]> = {};

    Object.values(dayActivities)
      .flat()
      .forEach((activity: any) => {
        const dayDate = activity?.day_date;
        if (!dayDate) return;
        if (!map[dayDate]) {
          map[dayDate] = [];
        }
        map[dayDate].push(activity);
      });

    Object.keys(map).forEach((key) => {
      map[key] = sortActivitiesForDisplay(map[key]);
    });

    return map;
  }, [dayActivities]);

  const mapActivities = useMemo(() => {
    const seen = new Set<string>();

    return localDayBlocks
      .flatMap((day) => day.activities ?? [])
      .filter((activity) => {
        if (!activity?.id) return false;
        if (seen.has(activity.id)) return false;
        seen.add(activity.id);
        return true;
      });
  }, [localDayBlocks]);

  useEffect(() => {
    LogBox.ignoreLogs([
      "Warning: ref.measureLayout must be called with a ref to a native component.",
      "ref.measureLayout must be called with a ref to a native component",
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

  const handleDayPress = (day: any) => {
    const params = new URLSearchParams({
      day: String(day.dayNumber),
      dayDate: String(day.day_date),
      displayDate: String(day.display_date ?? toLocalDateString(day.date)),
    });

    const itineraryDayId = String(day.itineraryDayId ?? day.id ?? "");
    if (itineraryDayId) {
      params.set("itineraryDayId", itineraryDayId);
    }

    router.push(`/trip/${tripId}/day-detail?${params.toString()}` as any);
  };

  const hasItinerary =
    localDayBlocks.some((day) => (day.activities?.length ?? 0) > 0) ||
    aiItinerary?.length > 0;

  useEffect(() => {
    const previousActivitiesByDayId = new Map<string, TripActivity[]>();
    const previousActivitiesByDayDate = new Map<string, TripActivity[]>();

    localDayBlocks.forEach((block: any) => {
      const blockDayId = block.itineraryDayId ?? block.id;
      if (blockDayId && Array.isArray(block.activities)) {
        previousActivitiesByDayId.set(blockDayId, block.activities);
      }
      if (block.day_date && Array.isArray(block.activities)) {
        previousActivitiesByDayDate.set(block.day_date, block.activities);
      }
    });

    const baseDays =
      itineraryDays && itineraryDays.length > 0
        ? itineraryDays.map((day: any, index: number) => {
          const displayDate = new Date(`${startDate}T00:00:00`);
          displayDate.setDate(displayDate.getDate() + index);

          return {
            ...day,
            itineraryDayId: day.id,
            date: displayDate,
            day_date: day.day_date,
            display_date: toLocalDateString(displayDate),
            dayNumber: index + 1,
            position: day.position ?? index + 1,
          };
        })
        : generateDayHeaders();

    const nextBlocks = baseDays.map((day: any, index: number) => {
      const itineraryDayId = day.itineraryDayId ?? day.id ?? null;
      const matchedActivities = itineraryDayId && previousActivitiesByDayId.has(itineraryDayId)
        ? previousActivitiesByDayId.get(itineraryDayId) ?? []
        : previousActivitiesByDayDate.has(day.day_date)
          ? previousActivitiesByDayDate.get(day.day_date) ?? []
          : itineraryDayId
            ? activitiesByItineraryDayId[itineraryDayId] ??
            activitiesByDayDate[day.day_date] ??
            dayActivities[index + 1] ?? []
            : activitiesByDayDate[day.day_date] ?? dayActivities[index + 1] ?? [];

      return {
        ...day,
        activities: sortActivitiesForDisplay(matchedActivities),
      };
    });

    setLocalDayBlocks(nextBlocks);
  }, [
    itineraryDays,
    dayActivities,
    activitiesByItineraryDayId,
    activitiesByDayDate,
    startDate,
    endDate,
  ]);

  const days = localDayBlocks;

  const listHeader = (
    <View className="px-6 pt-0">
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

      {/* Weather Forecast */}
      <Weather
        destination={destination}
        startDate={startDate}
        endDate={endDate}
      />

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="mb-0 px-6">
        {listHeader}

        {!isItineraryCollapsed && (
          <DraggableFlatList
            data={days}
            keyExtractor={(day) => String(day.id ?? day.itineraryDayId ?? `day-${day.dayNumber}`)}
            scrollEnabled={true}
            activationDistance={10}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item: day, drag: dragDay, isActive: isDayActive }) => (
              <View className="mb-6" style={{ opacity: isDayActive ? 0.95 : 1 }}>
                <View className="bg-neutral-surface rounded-lg p-4">
                  <View className="flex-row justify-between items-center mb-2">
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
                        <View>
                          <Text className="text-sm text-neutral-textSecondary mb-3">
                            {dedupeActivities(day.activities ?? []).length} activities
                          </Text>
                          <DraggableFlatList
                            data={sortActivitiesForDisplay(
                              dedupeActivities(day.activities ?? []),
                            )}
                            keyExtractor={(item, index) => `${day.dayNumber}-${item.id}-${index}`}
                            scrollEnabled={false}
                            activationDistance={8}
                            renderItem={({ item, drag, isActive }: RenderItemParams<TripActivity>) => (
                              <TouchableOpacity
                                activeOpacity={0.9}
                                className="bg-white rounded-lg p-3 border border-neutral-divider mb-2"
                                onPress={() => handleDayPress(day)}
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
        )}

        {/* Delete Itinerary Button - moved to bottom */}
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
      </View>
    </GestureHandlerRootView>
  );
}
