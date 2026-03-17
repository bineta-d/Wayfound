import HeaderSection from "@/components/HeaderSection";
import TabsSection from "@/components/TabsSection";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CollaboratorsSkeleton, ItinerarySkeleton, TargetSpotsSkeleton, TripDetailSkeleton } from "../../../components/TripDetailSkeleton";
import { useAuth } from "../../../context/AuthContext";
import {
  deleteTrip,
  getTripActivitiesForDay,
  getTripActivitiesGroupedByDay,
  getTripById,
  getTripMembers,
} from "../../../lib/TripService";
import { Trip, Trip_member } from "../../../lib/types";
import BudgetScreen from "./budget";
import CollaboratorsScreen from "./collaborators";
import GenerateItinerary from "./generate-itinerary";
import { default as ItineraryScreen } from "./itinerary";
import ReservationsSection from "./reservations";
import TargetSpots from "./target-spots";

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

  const handleAssignToDay = (activity: any, dayNumber: number) => {
    router.push(`/trip/${tripId}/day-detail?day=${dayNumber}`);
  };

  const handleMarkerNavigate = (a: any) => {
    router.push(`/trip/${tripId}/day-detail?day=1`);
  };

  const loadGroupedActivities = async () => {
    if (!tripId) return;
    try {
      console.log("🔍 Loading grouped activities for trip:", tripId);
      const grouped = await getTripActivitiesGroupedByDay(tripId as string);
      console.log("📍 Grouped activities loaded:", grouped);
      setGroupedActivities(grouped);

      if (trip) {
        const days = generateDayHeaders();
        days.forEach((day) => {
          loadDayActivities(day.dayNumber);
        });
      }

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

  const loadDayActivities = async (dayNumber: number) => {
    if (!tripId || !trip) return;
    setLoadingActivities((prev) => ({ ...prev, [dayNumber]: true }));
    try {
      const dayDate = new Date(trip.start_date);
      dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
      const dateStr = dayDate.toISOString().split("T")[0];

      const activities = await getTripActivitiesForDay(
        tripId as string,
        dateStr,
      );

      setDayActivities((prev) => ({ ...prev, [dayNumber]: activities }));
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
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
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
      setTrip(tripData);
      setMembers(membersData);
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
    if (trip) {
      const days = generateDayHeaders();
      days.forEach((day) => {
        loadDayActivities(day.dayNumber);
      });

      const defaultCollapsed: Record<number, boolean> = {};
      days.forEach((day) => {
        defaultCollapsed[day.dayNumber] = day.dayNumber !== 1;
      });
      setCollapsedDays(defaultCollapsed);
    }
  }, [trip, tripId]);

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

  return (
    <>
      {/* Tab Bar */}

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
                    tripId={""}
                    tripStartDate={""}
                    tripEndDate={""}
                    onRefresh={function (): void {
                      throw new Error("Function not implemented.");
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
            <BudgetScreen />
          </View>
        )}
      </ScrollView>
    </>
  );
}
