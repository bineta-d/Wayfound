import HeaderSection from "@/components/HeaderSection";
import TabsSection from "@/components/TabsSection";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CollaboratorsSkeleton, ItinerarySkeleton, TargetSpotsSkeleton, TripDetailSkeleton } from "../../../components/TripDetailSkeleton";
import { useAuth } from "../../../context/AuthContext";
import {
  deleteTrip,
  deleteTripActivity,
  getItineraryDaysForTrip,
  getTripActivitiesForDay,
  getTripActivitiesGroupedByDay,
  getTripById,
  getTripMembers,
  updateItineraryDayPositions,
  updateTripActivity,
  updateTripActivityPositions,
} from "../../../lib/TripService";
import { Trip, Trip_member } from "../../../lib/types";
import BudgetScreen from "./budget";
import CollaboratorsScreen from "./collaborators";
import GenerateItinerary from "./generate-itinerary";
import { default as ItineraryScreen } from "./itinerary";
import PollsScreen from "./polls";
import ReservationsSection from "./reservations";
import TargetSpots from "./target-spots";
import TripMap from "./trip-map";

export default function TripOverviewScreen() {
  const [activeTab, setActiveTab] = useState(0);
  // Reservation tab state for icons
  const [reservationTab, setReservationTab] = useState(0);
  const { tripId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Trip_member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for new components
  const [aiItinerary, setAiItinerary] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [targetSpots, setTargetSpots] = useState<string[]>([]);
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>(
    {},
  );
  const [isItineraryCollapsed, setIsItineraryCollapsed] = useState(false);
  const [dayActivities, setDayActivities] = useState<Record<number, any[]>>({});
  const [loadingActivities, setLoadingActivities] = useState<
    Record<number, boolean>
  >({});
  const [groupedActivities, setGroupedActivities] = useState<
    Record<string, any[]>
  >({});
  const [itineraryDays, setItineraryDays] = useState<any[]>([]);
  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const mapReveal = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;
  const revealedMapHeight = screenHeight * 0.9;
  const overlayTranslateY = mapReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, revealedMapHeight],
  });

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDisplayDateForIndex = (index: number) => {
    if (!trip?.start_date) return "";
    const displayDate = new Date(`${trip.start_date}T00:00:00`);
    displayDate.setDate(displayDate.getDate() + index);
    return toLocalDateString(displayDate);
  };

  const buildDayDetailParams = (dayNumber: number, day: any) => {
    const params = new URLSearchParams({
      day: String(dayNumber),
      dayDate: String(day?.day_date ?? ""),
      displayDate: getDisplayDateForIndex(dayNumber - 1),
    });

    const itineraryDayId = String(day?.id ?? day?.itineraryDayId ?? "");
    if (itineraryDayId) {
      params.set("itineraryDayId", itineraryDayId);
    }

    return params.toString();
  };

  useEffect(() => {
    setTrip(null);
    setMembers([]);
    setDayActivities({});
    setGroupedActivities({});
    setLoadingActivities({});
    setCollapsedDays({});
    setAiItinerary([]);
    setTargetSpots([]);
    setItineraryDays([]);
    setLoading(true);
  }, [tripId]);
  const handleReorderDays = async (reorderedDays: any[]) => {
    if (!tripId) return;

    const normalized = reorderedDays.map((day, index) => ({
      ...day,
      position: index + 1,
      dayNumber: index + 1,
    }));

    setItineraryDays(normalized);

    try {
      await updateItineraryDayPositions(
        normalized
          .filter((d) => Boolean(d.id))
          .map((d) => ({ id: d.id, position: d.position }))
      );

      const refreshed = await getItineraryDaysForTrip(tripId as string);
      setItineraryDays(refreshed);

      const grouped = await getTripActivitiesGroupedByDay(tripId as string);

      const rebuilt: Record<number, any[]> = {};
      refreshed.forEach((day, index) => {
        rebuilt[index + 1] = grouped[day.day_date] ?? [];
      });

      setDayActivities(rebuilt);
    } catch (e) {
      console.log("Error saving reordered days:", e);
    }
  };

  const toggleDayCollapse = (dayNumber: number) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  const toggleItineraryCollapse = () => {
    setIsItineraryCollapsed(!isItineraryCollapsed);
  };

  const addTargetSpot = (spot: string) => {
    if (spot.trim()) {
      setTargetSpots((prev) => [...prev, spot.trim()]);
    }
  };

  const removeTargetSpot = (index: number) => {
    setTargetSpots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAssignToDay = (_activity: any, dayNumber: number) => {
    const selectedDay = itineraryDays[dayNumber - 1];
    if (!selectedDay) {
      router.push(`/trip/${tripId}/day-detail?day=${dayNumber}`);
      return;
    }

    router.push(
      `/trip/${tripId}/day-detail?${buildDayDetailParams(dayNumber, selectedDay)}`,
    );
  };

  const handleMarkerNavigate = (activity: any) => {
    const matchedIndex = itineraryDays.findIndex((day) => {
      if (activity?.itinerary_day_id && day?.id === activity.itinerary_day_id) {
        return true;
      }
      if (activity?.day_date && day?.day_date === activity.day_date) {
        return true;
      }
      return false;
    });

    if (matchedIndex === -1) {
      router.push(`/trip/${tripId}/day-detail?day=1`);
      return;
    }

    const matchedDay = itineraryDays[matchedIndex];
    const dayNumber = matchedIndex + 1;

    router.push(
      `/trip/${tripId}/day-detail?${buildDayDetailParams(dayNumber, matchedDay)}`,
    );
  };

  const handleReorderDayActivities = async (dayNumber: number, reordered: any[]) => {
    const originalDayActivities = dayActivities[dayNumber] ?? [];
    const timeSlots = originalDayActivities.map((item) => ({
      start_time: item.start_time ?? null,
      end_time: item.end_time ?? null,
    }));

    const reorderedWithTimes = reordered.map((item, index) => ({
      ...item,
      start_time: timeSlots[index]?.start_time ?? item.start_time ?? null,
      end_time: timeSlots[index]?.end_time ?? item.end_time ?? null,
    }));

    setDayActivities((prev) => ({ ...prev, [dayNumber]: reorderedWithTimes }));

    try {
      await updateTripActivityPositions(
        reorderedWithTimes.map((item, index) => ({
          id: item.id,
          position: index + 1,
        }))
      );

      await Promise.all(
        reorderedWithTimes.map((item) =>
          updateTripActivity(item.id, {
            start_time: item.start_time,
            end_time: item.end_time,
          })
        )
      );
    } catch (e) {
      console.log("Error saving reordered activities:", e);
      await loadDayActivities(dayNumber);
    }
  };

  const loadGroupedActivities = async () => {
    if (!tripId) return;
    try {
      console.log("🔍 Loading grouped activities for trip:", tripId);
      const grouped = await getTripActivitiesGroupedByDay(tripId as string);
      console.log("📍 Grouped activities loaded:", grouped);
      setGroupedActivities(grouped);

      // Log activities with coordinates
      const allActivities = Object.values(grouped).flat();
      const activitiesWithCoords = allActivities.filter(
        (a) =>
          typeof a.latitude === "number" && typeof a.longitude === "number",
      );
      console.log(
        "🗺️ Activities with coordinates:",
        activitiesWithCoords.length,
      );
      console.log("📊 Total activities:", allActivities.length);
    } catch (e) {
      console.log("Error loading grouped activities:", e);
    }
  };

  const allPinnedActivities = useMemo(
    () => Object.values(groupedActivities).flat(),
    [groupedActivities],
  );

  const toggleMapSheet = () => {
    const next = !isMapSheetOpen;
    setIsMapSheetOpen(next);

    Animated.spring(mapReveal, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 12,
    }).start();
  };

  const loadDayActivities = async (dayNumber: number) => {
    if (!tripId || !trip) return;
    setLoadingActivities((prev) => ({ ...prev, [dayNumber]: true }));
    try {
      const mappedDay = itineraryDays[dayNumber - 1];
      const dateStr = mappedDay?.day_date
        ? mappedDay.day_date
        : (() => {
            const dayDate = new Date(`${trip.start_date}T00:00:00`);
            dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
            return toLocalDateString(dayDate);
          })();

      const activities = await getTripActivitiesForDay(
        tripId as string,
        dateStr,
      );

      const sorted = [...activities].sort((a, b) => {
        const aTime = a.start_time?.slice(0, 5) ?? null;
        const bTime = b.start_time?.slice(0, 5) ?? null;

        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;

        return aTime.localeCompare(bTime);
      });

      setDayActivities((prev) => ({ ...prev, [dayNumber]: sorted }));
      console.log(
        `📅 Loaded ${activities.length} activities for day ${dayNumber}`,
      );
    } catch (e) {
      console.log(`Error loading day ${dayNumber} activities:`, e);
    } finally {
      setLoadingActivities((prev) => ({ ...prev, [dayNumber]: false }));
    }
  };

  const generateDayHeaders = () => {
    if (!trip) return [];
    const start = new Date(`${trip.start_date}T00:00:00`);
    const end = new Date(`${trip.end_date}T00:00:00`);
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

  const loadTripData = async () => {
    try {
      const tripData = await getTripById(tripId as string);
      const membersData = await getTripMembers(tripId as string);
      const daysData = await getItineraryDaysForTrip(tripId as string);
      const grouped = await getTripActivitiesGroupedByDay(tripId as string);

      setTrip(tripData);
      setMembers(membersData);
      setItineraryDays(daysData);

      const rebuilt: Record<number, any[]> = {};
      daysData.forEach((day, index) => {
        rebuilt[index + 1] = grouped[day.day_date] ?? [];
      });
      setDayActivities(rebuilt);
    } catch (error) {
      console.error("Error loading trip:", error);
      Alert.alert("Error", "Failed to load trip details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripData();
    await loadGroupedActivities();
  };

  useFocusEffect(
    useCallback(() => {
      if (tripId) {
        loadTripData();
        loadGroupedActivities();
      }
    }, [tripId])
  )

  useEffect(() => {
    if (!trip || String(trip.id) !== String(tripId)) return;

    const dayCount = itineraryDays.length > 0
      ? itineraryDays.length
      : generateDayHeaders().length;

    const defaultCollapsed: Record<number, boolean> = {};
    for (let dayNumber = 1; dayNumber <= dayCount; dayNumber++) {
      defaultCollapsed[dayNumber] = dayNumber !== 1;
    }
    setCollapsedDays(defaultCollapsed);
  }, [trip, tripId, itineraryDays]);

  const removeActivity = async (activityId: string) => {
    console.log('🗑️ Removing activity:', activityId);
    try {
      // Delete from database first
      await deleteTripActivity(activityId);
      console.log('✅ Activity deleted from database');

      // Then update local state
      setGroupedActivities((prev) => {
        const newGrouped = { ...prev };

        // Remove activity from all days
        Object.keys(newGrouped).forEach(dayKey => {
          newGrouped[dayKey] = newGrouped[dayKey].filter(
            (activity: any) => activity.id !== activityId
          );
        });

        return newGrouped;
      });

      console.log('✅ Activity removed from local state');
    } catch (error) {
      console.error('❌ Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity. Please try again.');
    }
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(tripId as string);
              Alert.alert("Success", "Trip deleted successfully");
              router.back();
            } catch (error) {
              console.error("Error deleting trip:", error);
              Alert.alert("Error", "Failed to delete trip");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <>
        <TripDetailSkeleton />
      </>
    );
  }

  if (!trip) {
    return (
      <>
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-gray-600">Trip not found</Text>
        </View>
      </>
    );
  }

  const primaryContent = (
    <>
      {/* Tab Content */}
      {activeTab === 1 ? (
        <View className="flex-1 bg-gray-50">
          <View className="bg-white mb-2 flex-1">
            {/* Trip Header */}
            <HeaderSection title={trip.title} trip={trip} />

            {/* tabs Section */}
            <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />

            {refreshing ? (
              <ItinerarySkeleton />
            ) : (
              <View className="flex-1">
                <ItineraryScreen
                  tripId={tripId as string}
                  startDate={trip.start_date}
                  destination={trip.destination}
                  endDate={trip.end_date}
                  aiItinerary={aiItinerary}
                  itineraryDays={itineraryDays}
                  onReorderDays={handleReorderDays}
                  onToggleDayCollapse={toggleDayCollapse}
                  onToggleItineraryCollapse={toggleItineraryCollapse}
                  collapsedDays={collapsedDays}
                  isItineraryCollapsed={isItineraryCollapsed}
                  dayActivities={dayActivities}
                  loadingActivities={loadingActivities}
                  onReorderDayActivities={handleReorderDayActivities}
                />
              </View>
            )}
          </View>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-gray-50"
          horizontal={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Overview Tab */}
          {activeTab === 0 && (
            <>
              {/* Trip Header */}
              <HeaderSection title={trip.title} trip={trip} />

              {/* Tabs Section */}
              <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />

              {/* Reservations Section */}
              <View className="bg-white px-6 mb-1 pt-4">
                <ReservationsSection />
              </View>
              {/* Generate Itinerary Section */}
              <View className="bg-white px-6 mb-2">
                {!isMapSheetOpen && (
                  <GenerateItinerary
                    tripId={tripId as string}
                    destination={trip.destination}
                    startDate={trip.start_date}
                    endDate={trip.end_date}
                    duration={Math.ceil(
                      (new Date(`${trip.end_date}T00:00:00`).getTime() -
                        new Date(`${trip.start_date}T00:00:00`).getTime()) /
                      (1000 * 60 * 60 * 24),
                    )}
                    onItineraryGenerated={setAiItinerary}
                    loading={loadingAI}
                    setLoading={setLoadingAI}
                    activities={allPinnedActivities}
                    onMarkerNavigate={handleMarkerNavigate}
                  />
                )}
              </View>
              {/* Target Spots Section */}
              <View className="bg-white px-6 mb-2">
                {refreshing ? (
                  <TargetSpotsSkeleton />
                ) : (
                  <TargetSpots
                    targetSpots={targetSpots}
                    onAddSpot={addTargetSpot}
                    onRemoveSpot={removeTargetSpot}
                    activities={allPinnedActivities}
                    onAssignToDay={handleAssignToDay}
                    onRemoveActivity={removeActivity}
                    tripId={tripId as string}
                    tripStartDate={trip?.start_date || ''}
                    tripEndDate={trip?.end_date || ''}
                    onRefresh={onRefresh}
                  />
                )}
              </View>
              {/* Collaborators Section */}
              {refreshing ? (
                <CollaboratorsSkeleton />
              ) : (
                <CollaboratorsScreen members={members} />
              )}
              {/* Delete Button - Only for trip owners */}
              {user?.id === trip.owner_id && (
                <View className="px-6 py-4 mb-8">
                  <TouchableOpacity
                    onPress={handleDeleteTrip}
                    className="bg-red-500 px-6 py-3 rounded-lg items-center"
                  >
                    <Text className="text-white font-semibold">Delete Trip</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          {/* Reservations Tab */}
          {activeTab === 2 && (
            <View className="bg-white mb-2">
              {/* Trip Header */}
              <HeaderSection title={trip.title} trip={trip} />

              {/* Tabs Section  */}
              <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />

              {/* Reservation Icons Scroll*/}
              <View className="px-6 pt-2 flex-row justify-between border-b border-neutral-divider pb-2">
                {[
                  { label: "Accommodation", icon: "bed" },
                  { label: "Flight", icon: "airplane" },
                  { label: "Train", icon: "train" },
                  { label: "Bus", icon: "bus" },
                  { label: "Car Rental", icon: "car" },
                  { label: "Activities", icon: "ticket" },
                ].map((tab, idx) => (
                  <TouchableOpacity
                    key={tab.label}
                    className="items-center pt-3"
                    onPress={() => setReservationTab(idx)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        backgroundColor:
                          reservationTab === idx ? "#FDE7EF" : "#F3F4F6",
                        borderRadius: 999,
                        padding: 12,
                        marginBottom: 4,
                      }}
                    >
                      <Text>
                        <Ionicons
                          name={tab.icon as any}
                          size={20}
                          color={reservationTab === idx ? "#D81E5B" : "#A1A1AA"}
                        />
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: reservationTab === idx ? "#D81E5B" : "#6B7280",
                        fontWeight: reservationTab === idx ? "bold" : "normal",
                        fontSize: 12,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Active tab content: */}
              <View
                className="bg-neutral-background border border-neutral-divider rounded-xl mx-6 my-6 flex-1 justify-center items-center"
                style={{ minHeight: 200 }}
              >
                <Text className="text-xl font-bold text-crimsonMagenta text-center">
                  {
                    [
                      "Accommodation Files Page",
                      "Flights Files Page",
                      "Train Files Page",
                      "Bus Files Page",
                      "Car Rental Files Page",
                      "Activities Files Page",
                    ][reservationTab]
                  }
                </Text>
              </View>
            </View>
          )}
          {/* Budget Tab */}
          {activeTab === 3 && (
            <View className="bg-white mb-2">
              {/* Trip Header */}
              <HeaderSection title={trip.title} trip={trip} />

              <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />
              <BudgetScreen/>
            </View>
          )}
          {/* Polls Tab */}
          {activeTab === 4 && (
            <View className="bg-white mb-2 flex-1">
              <HeaderSection title={trip.title} trip={trip} />
              <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />
              <PollsScreen />
            </View>
          )}
        </ScrollView>
      )}
    </>
  );

  return (
    <View style={styles.root}>
      <View style={styles.mapLayer} pointerEvents={isMapSheetOpen ? "auto" : "none"}>
        <View style={[styles.mapSheet, { height: revealedMapHeight }]}>
          <View style={styles.mapBody}>
            <TripMap
              tripId={tripId as string}
              startDate={trip.start_date}
              endDate={trip.end_date}
              destination={trip.destination}
              activities={allPinnedActivities}
              onMarkerNavigate={handleMarkerNavigate}
              fullHeight
            />
          </View>
        </View>
      </View>

      <Animated.View
        style={[
          styles.overlay,
          {
            transform: [{ translateY: overlayTranslateY }],
          },
        ]}
      >
        {primaryContent}
      </Animated.View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleMapSheet}
        style={styles.floatingMapButton}
      >
        <Ionicons
          name={isMapSheetOpen ? "map-outline" : "map"}
          size={22}
          color="#FFFFFF"
        />
        <Text style={styles.floatingMapButtonText}>
          {isMapSheetOpen ? "Close map" : "Open map"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    backgroundColor: "#F3F4F6",
  },
  mapSheet: {
    marginTop: 0,
    marginHorizontal: 0,
    overflow: "hidden",
    borderRadius: 0,
  },
  mapBody: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 0,
    backgroundColor: "#FFFFFF",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  floatingMapButton: {
    position: "absolute",
    right: 20,
    bottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3A1FA8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  floatingMapButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
