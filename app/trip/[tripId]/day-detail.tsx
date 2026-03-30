import { DayDetailSkeleton } from "@/components/DayDetailSkeleton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import {
  addTripActivityToDay,
  deleteTripActivity,
  getItineraryDaysForTrip,
  getPlaceDetails,
  getTripActivitiesForDay,
  getTripActivitiesForItineraryDayId,
  getTripById,
  PlacePrediction,
  searchPlacePredictions,
  Activity as TripActivity,
  updateTripActivity,
  updateTripActivityPositions,
} from "../../../lib/TripService";
import { Trip } from "../../../lib/types";

export default function DayDetailScreen() {
  const { tripId, day, dayDate, itineraryDayId, displayDate } =
    useLocalSearchParams();
  const router = useRouter();

  const getSingleParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [resolvedItineraryDayId, setResolvedItineraryDayId] = useState<
    string | null
  >(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);

  const [activityName, setActivityName] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityStartTime, setActivityStartTime] = useState("");
  const [activityEndTime, setActivityEndTime] = useState("");

  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>(
    [],
  );
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placesError, setPlacesError] = useState("");

  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null,
  );
  const [editingLat, setEditingLat] = useState<number | null>(null);
  const [editingLng, setEditingLng] = useState<number | null>(null);

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayValue = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${dayValue}`;
  };

  const tripIdParam = getSingleParam(tripId);
  const dayParam = getSingleParam(day);
  const dayDateParam = getSingleParam(dayDate);
  const itineraryDayIdParam = getSingleParam(itineraryDayId);
  const displayDateParam = getSingleParam(displayDate);

  const dayNumber = parseInt(dayParam ?? "1", 10) || 1;

  let selectedDayDate: Date | null = null;

  if (displayDateParam) {
    selectedDayDate = parseLocalDate(displayDateParam);
  } else if (trip?.start_date) {
    const start = parseLocalDate(trip.start_date);
    selectedDayDate = new Date(start);
    selectedDayDate.setDate(start.getDate() + (dayNumber - 1));
  } else if (dayDateParam) {
    selectedDayDate = parseLocalDate(dayDateParam);
  }

  const dayDateStr = dayDateParam
    ? dayDateParam
    : selectedDayDate
      ? formatLocalDate(selectedDayDate)
      : null;

  const dayMapActivities = activities.filter(
    (a) => typeof a.latitude === "number" && typeof a.longitude === "number",
  );

  const computeDayRegion = (): Region => {
    if (dayMapActivities.length === 0) {
      return {
        latitude: 25.7617,
        longitude: -80.1918,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      };
    }

    const lats = dayMapActivities.map((a) => a.latitude as number);
    const lngs = dayMapActivities.map((a) => a.longitude as number);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;

    const latitudeDelta = Math.max(0.02, (maxLat - minLat) * 1.6);
    const longitudeDelta = Math.max(0.02, (maxLng - minLng) * 1.6);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  };

  const normalizeTime = (t: string): string | null => {
    const s = t.trim();
    if (!s) return null;
    if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
    return null;
  };

  const formatTimeRange = (
    start: string | null | undefined,
    end: string | null | undefined,
  ) => {
    const s = start ? start.slice(0, 5) : "";
    const e = end ? end.slice(0, 5) : "";
    if (s && e) return `${s}–${e}`;
    if (s) return s;
    if (e) return `Ends ${e}`;
    return "";
  };

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

      const aCreated = a.created_at ?? "";
      const bCreated = b.created_at ?? "";
      return aCreated.localeCompare(bCreated);
    });
  };

  useEffect(() => {
    if (itineraryDayIdParam) {
      setResolvedItineraryDayId(itineraryDayIdParam);
      return;
    }

    if (!tripIdParam) return;

    getItineraryDaysForTrip(tripIdParam)
      .then((days) => {
        const selected = days[dayNumber - 1];
        setResolvedItineraryDayId(selected?.id ?? null);
      })
      .catch(() => {
        setResolvedItineraryDayId(null);
      });
  }, [tripIdParam, dayNumber, itineraryDayIdParam]);

  useEffect(() => {
    if (tripIdParam) {
      getTripById(tripIdParam)
        .then((data) => setTrip(data))
        .finally(() => setLoading(false));
    }
  }, [tripIdParam]);

  const loadActivities = async () => {
    if (!tripIdParam) return;

    setLoadingActivities(true);
    try {
      let data: TripActivity[] = [];

      if (resolvedItineraryDayId) {
        data =
          await getTripActivitiesForItineraryDayId(resolvedItineraryDayId);
      }

      if (data.length === 0 && dayDateStr) {
        data = await getTripActivitiesForDay(tripIdParam, dayDateStr);
      }

      setActivities(sortActivitiesForDisplay(data));
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleReorderActivities = async (reordered: TripActivity[]) => {
    const originalActivities = activities;
    const timeSlots = originalActivities.map((item) => ({
      start_time: item.start_time ?? null,
      end_time: item.end_time ?? null,
    }));

    const reorderedWithTimes = reordered.map((item, index) => ({
      ...item,
      start_time: timeSlots[index]?.start_time ?? item.start_time ?? null,
      end_time: timeSlots[index]?.end_time ?? item.end_time ?? null,
      position: index + 1,
    }));

    setActivities(reorderedWithTimes);

    try {
      await updateTripActivityPositions(
        reorderedWithTimes.map((item, index) => ({
          id: item.id,
          position: index + 1,
        })),
      );

      await Promise.all(
        reorderedWithTimes.map((item) =>
          updateTripActivity(item.id, {
            start_time: item.start_time,
            end_time: item.end_time,
          }),
        ),
      );
    } catch (error) {
      console.log("Error saving reordered activities:", error);
      await loadActivities();
    }
  };

  useEffect(() => {
    if (!tripIdParam) return;
    if (!resolvedItineraryDayId && !dayDateStr) return;
    loadActivities();
  }, [tripIdParam, resolvedItineraryDayId, dayDateStr]);

  useEffect(() => {
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
    setActivityStartTime("");
    setActivityEndTime("");

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
    setActivityStartTime(
      activity.start_time ? activity.start_time.slice(0, 5) : "",
    );
    setActivityEndTime(
      activity.end_time ? activity.end_time.slice(0, 5) : "",
    );

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
    setActivityStartTime("");
    setActivityEndTime("");
  };

  const saveManualActivity = async () => {
    if (!tripIdParam || !dayDateStr) return;

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

      if (!editingActivityId) {
        const inserted = await addTripActivityToDay({
          trip_id: tripIdParam,
          day_date: dayDateStr,
          location_name,
          title: activityTitle.trim() ? activityTitle.trim() : null,
          description: activityDescription.trim()
            ? activityDescription.trim()
            : null,
          latitude,
          longitude,
          start_time: normalizeTime(activityStartTime),
          end_time: normalizeTime(activityEndTime),
        });

        setActivities((prev) => [...prev, inserted]);
        closeAddModal();
        return;
      }

      const updated = await updateTripActivity(editingActivityId, {
        location_name,
        title: activityTitle.trim() ? activityTitle.trim() : null,
        description: activityDescription.trim()
          ? activityDescription.trim()
          : null,
        latitude,
        longitude,
        start_time: normalizeTime(activityStartTime),
        end_time: normalizeTime(activityEndTime),
      });

      setActivities((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      closeAddModal();
    } finally {
      setSavingActivity(false);
    }
  };

  if (loading) {
    return <DayDetailSkeleton />;
  }

  return (
    <ScrollView className="flex-1 bg-neutral-background">
      <View className="bg-neutral-surface px-6 py-6 mb-2">
        {selectedDayDate && (
          <Text className="text-2xl font-bold text-neutral-textPrimary mb-2">
            Day {dayNumber} -{" "}
            {selectedDayDate.toLocaleDateString("en-US", {
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

      <View className="bg-neutral-surface px-6 py-6 mb-2">
        <Text className="text-xl font-bold text-neutral-textPrimary mb-4">
          Day Map
        </Text>

        <View className="rounded-lg overflow-hidden border border-neutral-divider bg-neutral-surface">
          <View className="px-4 py-3 border-b border-neutral-divider">
            <Text className="text-neutral-textPrimary font-semibold">
              Pinned activities
            </Text>
            <Text className="text-neutral-textSecondary text-xs mt-1">
              {dayMapActivities.length > 0
                ? `${dayMapActivities.length} pinned activities`
                : "No pinned activities yet"}
            </Text>
          </View>

          <View style={{ height: 200 }}>
            {dayMapActivities.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-neutral-textSecondary">
                  Add a location to pin activities
                </Text>
              </View>
            ) : (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={computeDayRegion()}
              >
                {dayMapActivities.map((a) => (
                  <Marker
                    key={a.id}
                    coordinate={{
                      latitude: a.latitude as number,
                      longitude: a.longitude as number,
                    }}
                  >
                    <Callout onPress={() => openEditModal(a)}>
                      <View style={{ maxWidth: 220 }}>
                        <Text style={{ fontWeight: "600" }}>
                          {(a.title?.trim() ||
                            a.location_name ||
                            "Activity"
                          ).split(",")[0]}
                        </Text>
                        {formatTimeRange(a.start_time, a.end_time) ? (
                          <Text style={{ marginTop: 4, color: "#67717B" }}>
                            {formatTimeRange(a.start_time, a.end_time)}
                          </Text>
                        ) : null}
                        {a.location_name ? (
                          <Text style={{ marginTop: 4, color: "#67717B" }}>
                            {a.location_name}
                          </Text>
                        ) : null}
                        <Text
                          style={{
                            marginTop: 6,
                            color: "#3A1FA8",
                            fontWeight: "600",
                          }}
                        >
                          Edit activity
                        </Text>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>
            )}
          </View>
        </View>
      </View>

      <View className="bg-neutral-background px-6 py-6 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-neutral-textPrimary">
            Activities
          </Text>
          <TouchableOpacity activeOpacity={0.9} onPress={openAddModal}>
            <LinearGradient
              colors={["#3A1FA8", "#5B3DF5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 8 }}
            >
              <View className="px-4 py-2 rounded-lg">
                <Text className="text-white font-semibold">
                  + Add Activity
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {loadingActivities ? (
          <DayDetailSkeleton />
        ) : activities.length === 0 ? (
          <View className="bg-neutral-background rounded-lg p-4 border border-neutral-divider">
            <Text className="text-neutral-textSecondary text-center">
              No activities added yet
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={sortActivitiesForDisplay(activities)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            activationDistance={8}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item: a, drag, isActive }: RenderItemParams<TripActivity>) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openEditModal(a)}
                className="bg-neutral-background rounded-lg p-4 border border-neutral-divider"
                style={{ opacity: isActive ? 0.9 : 1 }}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <View>
                      <Text
                        className="text-neutral-textPrimary font-semibold text-base"
                        numberOfLines={2}
                      >
                        {a.title?.trim() || a.location_name || "Activity"}
                      </Text>

                      {!!a.location_name && (
                        <Text className="text-neutral-textSecondary mt-1">
                          {a.location_name}
                        </Text>
                      )}

                      {formatTimeRange(a.start_time, a.end_time) ? (
                        <View className="self-start px-2 py-1 rounded-full bg-neutral-divider mt-2">
                          <Text className="text-xs text-neutral-textSecondary">
                            {formatTimeRange(a.start_time, a.end_time)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {!!a.description && (
                      <Text
                        className="text-neutral-textSecondary mt-2"
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {a.description}
                      </Text>
                    )}
                  </View>

                  <View className="items-end ml-2">
                    <TouchableOpacity
                      onLongPress={drag}
                      delayLongPress={120}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="p-2 mb-2"
                    >
                      <Ionicons
                        name="reorder-four"
                        size={18}
                        color={isActive ? "#3B82F6" : "#6B7280"}
                      />
                    </TouchableOpacity>

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
              </TouchableOpacity>
            )}
            onDragEnd={({ data }) => {
              handleReorderActivities(data);
            }}
          />
        )}
      </View>

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
              <Text className="text-white font-semibold">
                Generate Itinerary
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

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

            <Text className="text-neutral-textSecondary mb-2">
              Location name *
            </Text>
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
              <Text className="text-xs text-accent-hotCoral mb-3">
                {placesError}
              </Text>
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
                      <Text className="text-neutral-textPrimary">
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <Text className="text-neutral-textSecondary mb-2">
              Title (optional)
            </Text>
            <TextInput
              value={activityTitle}
              onChangeText={setActivityTitle}
              placeholder="e.g., Morning walk"
              placeholderTextColor="#67717B"
              className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
            />

            <Text className="text-neutral-textSecondary mb-2">
              Description (optional)
            </Text>
            <TextInput
              value={activityDescription}
              onChangeText={setActivityDescription}
              placeholder="Notes..."
              placeholderTextColor="#67717B"
              multiline
              className="border border-neutral-divider rounded-xl px-4 py-3 mb-4 text-neutral-textPrimary"
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-neutral-textSecondary mb-2">
                  Start time (optional)
                </Text>
                <TextInput
                  value={activityStartTime}
                  onChangeText={setActivityStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#67717B"
                  className="border border-neutral-divider rounded-xl px-4 py-3 text-neutral-textPrimary"
                />
              </View>

              <View className="flex-1">
                <Text className="text-neutral-textSecondary mb-2">
                  End time (optional)
                </Text>
                <TextInput
                  value={activityEndTime}
                  onChangeText={setActivityEndTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#67717B"
                  className="border border-neutral-divider rounded-xl px-4 py-3 text-neutral-textPrimary"
                />
              </View>
            </View>

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
                      ? savingActivity
                        ? "Saving..."
                        : "Save Changes"
                      : savingActivity
                        ? "Saving..."
                        : "Save Activity"}
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