import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import {
  getTripById,
  getTripMembers,
  deleteTrip,
} from "../../../lib/TripService";
import { Trip, Trip_member } from "../../../lib/types";
import ItineraryScreen from "./itinerary";
import CollaboratorsScreen from "./collaborators";
import BudgetScreen from "./budget";
import BookingsScreen from "./bookings";

export default function TripOverviewScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Trip_member[]>([]);
  const [loading, setLoading] = useState(true);

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
      <ScrollView className="flex-1 bg-gray-50">
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

        {/* Itinerary Section */}
        <ItineraryScreen
          tripId={tripId as string}
          startDate={trip.start_date}
          endDate={trip.end_date}
          destination={trip.destination}
        />

        {/* Bookings Section */}
        <BookingsScreen />

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
