import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getTripById,
  getTripActivitiesForDay,
  addTripActivityToDay,
  deleteTripActivity,
  updateTripActivity,
  Activity as TripActivity,
  searchPlacePredictions,
  getPlaceDetails,
  PlacePrediction,
} from "../../../lib/TripService";
import { Trip } from "../../../lib/types";

export default function DayDetailScreen() {
  const { tripId, day } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);

  const [activityName, setActivityName] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placesError, setPlacesError] = useState("");

  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingLat, setEditingLat] = useState<number | null>(null);
  const [editingLng, setEditingLng] = useState<number | null>(null);

  useEffect(() => {
    if (tripId) {
      getTripById(tripId as string)
        .then((data) => setTrip(data))
        .finally(() => setLoading(false));
    }
  }, [tripId]);

  // calculate the date for the selected day
  let dayNumber = parseInt(day as string, 10) || 1;
  let dayDate: Date | null = null;
  if (trip && trip.start_date) {
    const start = new Date(trip.start_date);
    dayDate = new Date(start);
    dayDate.setDate(start.getDate() + (dayNumber - 1));
  }

  const dayDateStr =
    dayDate
      ? new Date(Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()))
          .toISOString()
          .slice(0, 10)
      : null;

  const loadActivities = async () => {
    if (!tripId || !dayDateStr) return;
    setLoadingActivities(true);
    try {
      const data = await getTripActivitiesForDay(tripId as string, dayDateStr);
      setActivities(data);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (!tripId || !dayDateStr) return;
    loadActivities();
  }, [tripId, dayDateStr]);

  useEffect(() => {
    // If a place was selected, don't refetch predictions for the filled text.
    if (selectedPlaceId) return;

    const q = activityName.trim();
    if (q.length < 2) {
      setPlacePredictions([]);
      setPlacesError("");
      return;
    }

    const t = setTimeout(async () => {
      setLoadingPlaces(true);
      setPlacesError("");
      try {
        const preds = await searchPlacePredictions(q);
        setPlacePredictions(preds);
      } catch (e: any) {
        setPlacePredictions([]);
        setPlacesError(e?.message ?? "Places search failed");
      } finally {
        setLoadingPlaces(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [activityName, selectedPlaceId]);

  const openAddModal = () => {
    setEditingActivityId(null);
    setEditingLat(null);
    setEditingLng(null);

    setActivityName("");
    setActivityTitle("");
    setActivityDescription("");

    setPlacePredictions([]);
    setLoadingPlaces(false);
    setSelectedPlaceId(null);
    setPlacesError("");

    setAddModalVisible(true);
  };

  const openEditModal = (activity: TripActivity) => {
    setEditingActivityId(activity.id);
    setEditingLat(activity.latitude ?? null);
    setEditingLng(activity.longitude ?? null);

    setActivityName(activity.location_name ?? "");
    setActivityTitle(activity.title ?? "");
    setActivityDescription(activity.description ?? "");

    setPlacePredictions([]);
    setLoadingPlaces(false);
    setSelectedPlaceId(null);
    setPlacesError("");

    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setEditingActivityId(null);
    setEditingLat(null);
    setEditingLng(null);
    setPlacePredictions([]);
    setLoadingPlaces(false);
    setSelectedPlaceId(null);
    setPlacesError("");
  };

  const saveManualActivity = async () => {
    if (!tripId || !dayDateStr) return;

    const trimmedName = activityName.trim();
    if (!trimmedName) return;

    setSavingActivity(true);
    try {
      let location_name = trimmedName;
      let latitude: number | null = editingLat;
      let longitude: number | null = editingLng;

      if (selectedPlaceId) {
        const details = await getPlaceDetails(selectedPlaceId);
        location_name = details.location_name;
        latitude = details.latitude;
        longitude = details.longitude;
      }

      // ADD
      if (!editingActivityId) {
        const inserted = await addTripActivityToDay({
          trip_id: tripId as string,
          day_date: dayDateStr,
          location_name,
          title: activityTitle.trim() ? activityTitle.trim() : null,
          description: activityDescription.trim() ? activityDescription.trim() : null,
          latitude,
          longitude,
        });

        setActivities((prev) => [...prev, inserted]);
        closeAddModal();
        return;
      }

      // EDIT
      const updated = await updateTripActivity(editingActivityId, {
        location_name,
        title: activityTitle.trim() ? activityTitle.trim() : null,
        description: activityDescription.trim() ? activityDescription.trim() : null,
        latitude,
        longitude,
      });

      setActivities((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      closeAddModal();
    } finally {
      setSavingActivity(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-neutral-background">
      {/* Trip Header */}
      <View className="bg-neutral-surface px-6 py-6 mb-2">
        {dayDate && (
          <Text className="text-2xl font-bold text-neutral-textPrimary mb-2">
            Day {dayNumber} -{" "}
            {dayDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        )}
        <View className="flex-row items-center mb-2">
          <Text className="text-neutral-textSecondary mr-2">📍</Text>
          <Text className="text-neutral-textPrimary text-lg">
            {trip ? trip.destination : ""}
          </Text>
        </View>
      </View>

      {/* Map Section */}
      <View className="bg-neutral-surface px-6 py-6 mb-2">
        <Text className="text-xl font-bold text-neutral-textPrimary mb-4">Trip Map</Text>
        <View className="bg-neutral-divider rounded-lg h-48 items-center justify-center mb-4">
          <Text className="text-neutral-textSecondary text-center mb-2">🗺️</Text>
          <Text className="text-neutral-textPrimary text-center font-medium">
            Interactive Map
          </Text>
          <Text className="text-neutral-textSecondary text-sm">
            Google Maps integration coming soon
          </Text>
        </View>
      </View>

      {/* Activities Section */}
      <View className="bg-neutral-background px-6 py-6 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-neutral-textPrimary">Activities</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={openAddModal}>
            <LinearGradient
              colors={["#3A1FA8", "#5B3DF5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 8 }}
            >
              <View className="px-4 py-2 rounded-lg">
                <Text className="text-white font-semibold">+ Add Activity</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {loadingActivities ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-neutral-textSecondary mt-3">Loading activities...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View className="bg-neutral-background rounded-lg p-4 border border-neutral-divider">
            <Text className="text-neutral-textSecondary text-center">
              No activities added yet
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {activities.map((a) => (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.9}
                onPress={() => openEditModal(a)}
                className="bg-neutral-background rounded-lg p-4 border border-neutral-divider"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="text-neutral-textPrimary font-semibold text-base">
                      {a.location_name ?? "Activity"}
                    </Text>
                    {!!a.title && (
                      <Text className="text-neutral-textSecondary mt-1">{a.title}</Text>
                    )}
                    {!!a.description && (
                      <Text className="text-neutral-textSecondary mt-1">{a.description}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={async () => {
                      await deleteTripActivity(a.id);
                      setActivities((prev) => prev.filter((x) => x.id !== a.id));
                    }}
                    className="px-3 py-2 rounded-lg bg-accent-hotCoral"
                  >
                    <Text className="text-white font-semibold">Remove</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Generate Itinerary Button */}
      <View className="px-6 py-4 mb-8">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => console.log("Generate itinerary pressed")}
        >
          <LinearGradient
            colors={["#D81E5B", "#FF4D4D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 8 }}
          >
            <View className="px-6 py-3 rounded-lg items-center">
              <Text className="text-white font-semibold">Generate Itinerary</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add Activity Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAddModal}
      >
        <View
          className="flex-1 items-center justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <View className="w-full rounded-t-3xl bg-neutral-surface px-6 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-neutral-textPrimary">
                {editingActivityId ? "Edit Activity" : "Add Activity"}
              </Text>
              <TouchableOpacity onPress={closeAddModal} className="p-2">
                <Ionicons name="close" size={22} color="#67717B" />
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-textSecondary mb-2">Location name *</Text>
            <TextInput
              value={activityName}
              onChangeText={(text) => {
                setSelectedPlaceId(null);
                setPlacesError("");
                setActivityName(text);
              }}
              placeholder="e.g., Wynwood Walls"
              placeholderTextColor="#67717B"
              className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
            />

            {loadingPlaces && (
              <View className="mb-4">
                <ActivityIndicator />
              </View>
            )}

            {placesError.length > 0 && (
              <Text className="text-xs text-accent-hotCoral mb-3">{placesError}</Text>
            )}

            {placePredictions.length > 0 && (
              <View className="border border-neutral-divider rounded-xl mb-4 overflow-hidden">
                <FlatList
                  keyboardShouldPersistTaps="handled"
                  data={placePredictions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="px-4 py-3 bg-neutral-surface border-b border-neutral-divider"
                      onPress={() => {
                        setSelectedPlaceId(item.place_id);
                        setActivityName(item.description);
                        setPlacePredictions([]);
                      }}
                    >
                      <Text className="text-neutral-textPrimary">{item.description}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <Text className="text-neutral-textSecondary mb-2">Title (optional)</Text>
            <TextInput
              value={activityTitle}
              onChangeText={setActivityTitle}
              placeholder="e.g., Morning walk"
              placeholderTextColor="#67717B"
              className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
            />

            <Text className="text-neutral-textSecondary mb-2">Description (optional)</Text>
            <TextInput
              value={activityDescription}
              onChangeText={setActivityDescription}
              placeholder="Notes..."
              placeholderTextColor="#67717B"
              multiline
              className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />

            <TouchableOpacity
              disabled={savingActivity || activityName.trim().length === 0}
              onPress={saveManualActivity}
              activeOpacity={0.9}
              style={{
                opacity:
                  savingActivity || activityName.trim().length === 0 ? 0.7 : 1,
              }}
            >
              <LinearGradient
                colors={["#3A1FA8", "#5B3DF5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 12 }}
              >
                <View className="items-center rounded-xl py-4">
                  <Text className="text-white font-semibold">
                    {editingActivityId
                      ? (savingActivity ? "Saving..." : "Save Changes")
                      : (savingActivity ? "Saving..." : "Save Activity")}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
