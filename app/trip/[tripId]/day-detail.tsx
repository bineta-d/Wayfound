import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getTripById, getTripActivitiesForDay, addTripActivityToDay, deleteTripActivity, Activity as TripActivity } from "../../../lib/TripService";
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
  const [activityLat, setActivityLat] = useState("");
  const [activityLng, setActivityLng] = useState("");

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

  const openAddModal = () => {
    setActivityName("");
    setActivityTitle("");
    setActivityDescription("");
    setActivityLat("");
    setActivityLng("");
    setAddModalVisible(true);
  };

  const closeAddModal = () => setAddModalVisible(false);

  const saveManualActivity = async () => {
    if (!tripId || !dayDateStr) return;

    const trimmedName = activityName.trim();
    if (!trimmedName) return;

    const latNum = activityLat.trim() ? Number(activityLat.trim()) : null;
    const lngNum = activityLng.trim() ? Number(activityLng.trim()) : null;

    if (activityLat.trim() && Number.isNaN(latNum)) return;
    if (activityLng.trim() && Number.isNaN(lngNum)) return;

    setSavingActivity(true);
    try {
      const inserted = await addTripActivityToDay({
        trip_id: tripId as string,
        day_date: dayDateStr,
        location_name: trimmedName,
        title: activityTitle.trim() ? activityTitle.trim() : null,
        description: activityDescription.trim() ? activityDescription.trim() : null,
        latitude: latNum,
        longitude: lngNum,
      });

      setActivities((prev) => [...prev, inserted]);
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
          <TouchableOpacity
            className="bg-primary-royalPurple px-4 py-2 rounded-lg"
            onPress={openAddModal}
          >
            <Text className="text-white font-semibold">+ Add Activity</Text>
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
              <View
                key={a.id}
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
                    {a.latitude != null && a.longitude != null && (
                      <Text className="text-neutral-textSecondary mt-2 text-xs">
                        {a.latitude}, {a.longitude}
                      </Text>
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
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Generate Itinerary Button */}
      <View className="px-6 py-4 mb-8">
        <TouchableOpacity
          className="bg-accent-crimsonMagenta px-6 py-3 rounded-lg items-center"
          onPress={() => console.log("Generate itinerary pressed")}
        >
          <Text className="text-white font-semibold">Generate Itinerary</Text>
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
                Add Activity
              </Text>
              <TouchableOpacity onPress={closeAddModal} className="p-2">
                <Ionicons name="close" size={22} color="#67717B" />
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-textSecondary mb-2">Location name *</Text>
            <TextInput
              value={activityName}
              onChangeText={setActivityName}
              placeholder="e.g., Wynwood Walls"
              placeholderTextColor="#67717B"
              className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
            />

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

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-neutral-textSecondary mb-2">Latitude (optional)</Text>
                <TextInput
                  value={activityLat}
                  onChangeText={setActivityLat}
                  placeholder="25.80"
                  placeholderTextColor="#67717B"
                  keyboardType="numeric"
                  className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
                />
              </View>

              <View className="flex-1">
                <Text className="text-neutral-textSecondary mb-2">Longitude (optional)</Text>
                <TextInput
                  value={activityLng}
                  onChangeText={setActivityLng}
                  placeholder="-80.20"
                  placeholderTextColor="#67717B"
                  keyboardType="numeric"
                  className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
                />
              </View>
            </View>

            <TouchableOpacity
              disabled={savingActivity || activityName.trim().length === 0}
              onPress={saveManualActivity}
              className="items-center rounded-xl py-4 bg-primary-electricViolet"
              style={{
                opacity:
                  savingActivity || activityName.trim().length === 0 ? 0.7 : 1,
              }}
            >
              <Text className="text-white font-semibold">
                {savingActivity ? "Saving..." : "Save Activity"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
