import HeaderSection from "@/components/HeaderSection";
import TabsSection from "@/components/TabsSection";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
    }
  };

  useEffect(() => {
    if (tripId) {
      loadTripData();
      loadGroupedActivities();
    }
  }, [tripId]);

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
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-gray-600">Loading trip details...</Text>
        </View>
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
      <ScrollView
        className="flex-1 bg-gray-50"
        horizontal={false}
        showsVerticalScrollIndicator={false}
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
              <GenerateItinerary
                tripId={tripId as string}
                destination={trip.destination}
                startDate={trip.start_date}
                endDate={trip.end_date}
                duration={Math.ceil(
                  (new Date(trip.end_date).getTime() -
                    new Date(trip.start_date).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}
                onItineraryGenerated={setAiItinerary}
                loading={loadingAI}
                setLoading={setLoadingAI}
                activities={Object.values(groupedActivities).flat()}
                onMarkerNavigate={handleMarkerNavigate}
              />
            </View>
            {/* Target Spots Section */}
            <View className="bg-white px-6 mb-2">
              <TargetSpots
                targetSpots={targetSpots}
                onAddSpot={addTargetSpot}
                onRemoveSpot={removeTargetSpot}
                activities={Object.values(groupedActivities).flat()}
                onAssignToDay={handleAssignToDay}
              />
            </View>
            {/* Collaborators Section */}
            <CollaboratorsScreen members={members} />
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
        {/* Itinerary Tab */}
        {activeTab === 1 && (
          <View className="bg-white mb-2">
            {/* Trip Header */}
            <HeaderSection title={trip.title} trip={trip} />

            {/* tabs Section */}
            <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />

            <ItineraryScreen
              tripId={tripId as string}
              startDate={trip.start_date}
              destination={trip.destination}
              endDate={trip.end_date}
              aiItinerary={aiItinerary}
              onToggleDayCollapse={toggleDayCollapse}
              onToggleItineraryCollapse={toggleItineraryCollapse}
              collapsedDays={collapsedDays}
              isItineraryCollapsed={isItineraryCollapsed}
              dayActivities={dayActivities}
              loadingActivities={loadingActivities}
            />
          </View>
        )}
        {/* Reservations Tab */}
        {activeTab === 2 && (
          <View className="bg-white mb-2">
            {/* Trip Header */}
            <HeaderSection title={trip.title} trip={trip} />

            {/* Tabs Section (always present) */}
            <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Reservation Icons Scroll (tabbing logic) */}
            <View className="px-6 pt-2">
              <ReservationsSection />
            </View>

            {/* Feature Guide for Reservations Tab Implementation */}
            {/* <View className="px-6 py-4 mb-2 bg-neutral-background rounded-lg border border-neutral-divider">
              <Text className="text-lg font-bold mb-2 text-crimsonMagenta">
                Reservations Tab Feature Guide
              </Text>
              <Text className="text-base mb-2 text-neutral-textPrimary">
                To implement the reservation type tabs below:
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                <Text style={{ fontWeight: "bold" }}>Logic Overview:</Text>
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                - Each reservation icon below acts as a tab. When clicked, set
                the active reservation tab and display the relevant content area
                below. - For each tab, fetch and render all files uploaded to
                the corresponding storage bucket for this trip (e.g.,
                hotel/accommodation files from the 'accommodations' bucket,
                flight files from the 'flights' bucket, etc.). - Each file
                should be rendered as a clickable document (image, PDF, docx,
                etc.). On click, open a modal for full preview. - Integrate the
                email-scanner feature so scanned reservation emails are parsed
                and uploaded to the correct bucket and shown in the relevant
                tab.
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                <Text style={{ fontWeight: "bold" }}>
                  Required Storage Buckets:
                </Text>
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                - Create individual storage buckets for each reservation type:
                {"\n"} • accommodations
                {"\n"} • flights
                {"\n"} • trains
                {"\n"} • buses
                {"\n"} • car_rentals
                {"\n"} • activities
                {"\n"} • (currently only 'trip-uploads' exists)
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                <Text style={{ fontWeight: "bold" }}>
                  Email-Scanner Integration:
                </Text>
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                - For each tab, integrate the email-scanner so reservation
                confirmation emails are parsed and relevant files (PDFs,
                screenshots, etc.) are automatically uploaded to the correct
                bucket and displayed in the tab. - See the feature/email-scanner
                branch for implementation details.
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                <Text style={{ fontWeight: "bold" }}>Next Steps:</Text>
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                - Create individual storage buckets for each reservation type.
                {"\n"}- Implement file fetching and rendering logic for each
                tab.
                {"\n"}- Integrate email-scanner feature for automated uploads.
              </Text>
              <Text className="text-base mb-2 text-neutral-textSecondary">
                <Text style={{ fontWeight: "bold" }}>Note:</Text> The
                ReservationsSection component should remain unchanged for use in
                other screens. Do not modify the icon UI or styles.
              </Text>
            </View> */}
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
