import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import {
  deleteTrip,
  getTripById,
  getTripMembers,
} from "../../../lib/TripService";
import { Trip, Trip_member } from "../../../lib/types";
import BudgetScreen from "./budget";
import Collaboration from "./collaboration";
import CollaboratorsScreen from "./collaborators";
import GenerateItinerary from "./generate-itinerary";
import ItineraryScreen from "./itinerary";
import ReservationsSection from "./reservations";
import TargetSpots from "./target-spots";

export default function TripOverviewScreen() {
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
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});
  const [isItineraryCollapsed, setIsItineraryCollapsed] = useState(false);
  const [dayActivities, setDayActivities] = useState<Record<number, any[]>>({});
  const [loadingActivities, setLoadingActivities] = useState<Record<number, boolean>>({});
  const [groupedActivities, setGroupedActivities] = useState<Record<string, any[]>>({});

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

  const handleMarkerNavigate = (a: any) => {
    // Navigate to day detail for the activity
    router.push(`/trip/${tripId}/day-detail?day=1`);
  };

  useEffect(() => {
    if (tripId) {
      loadTripData();
    }
  }, [tripId]);

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
      <ScrollView className="flex-1 bg-gray-50 m">
        {/* Trip Header */}
        <View className="bg-white px-6 py-6 mb-2">
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            {trip.title}
          </Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-600 mr-2">📍</Text>
            <Text className="text-gray-700 text-lg">{trip.destination}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-600 mr-2">📅</Text>
            <Text className="text-gray-700">
              {new Date(trip.start_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(trip.end_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Reservations Section */}
        <View className="bg-white px-6 mb-1">
          <ReservationsSection />
        </View>

        {/* Generate Itinerary Section */}
        <View className="bg-white px-6 py-6 mb-2">
          <GenerateItinerary
            destination={trip.destination}
            duration={Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))}
            onItineraryGenerated={setAiItinerary}
            loading={loadingAI}
            setLoading={setLoadingAI}
            activities={Object.values(groupedActivities).flat()}
            onMarkerNavigate={handleMarkerNavigate}
          /></View>

        {/* Itinerary Section */}
        <View className="bg-white px-6 py-6 mb-2">
          <ItineraryScreen
            tripId={tripId as string}
            startDate={trip.start_date}
            endDate={trip.end_date}
            aiItinerary={aiItinerary}
            onToggleDayCollapse={toggleDayCollapse}
            onToggleItineraryCollapse={toggleItineraryCollapse}
            collapsedDays={collapsedDays}
            isItineraryCollapsed={isItineraryCollapsed}
            dayActivities={dayActivities}
            loadingActivities={loadingActivities}
          /></View>

        {/* Target Spots Section */}
        <View className="bg-white px-6 py-6 mb-2">
          <TargetSpots
            targetSpots={targetSpots}
            onAddSpot={addTargetSpot}
            onRemoveSpot={removeTargetSpot}
          /></View>


        {/* Collaboration Section */}
        <Collaboration />

        {/* Collaborators Section */}
        <CollaboratorsScreen members={members} />

        {/* Budget Section */}
        <BudgetScreen />

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
      </ScrollView>
    </>
  );
}
