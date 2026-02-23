import { generateTripPlan } from "@/lib/ai";
import { LinearGradient } from "expo-linear-gradient";
import React from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import MapView, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { Activity as TripActivity } from "../../../lib/TripService";

interface GenerateItineraryProps {
  destination: string;
  duration: number;
  onItineraryGenerated: (itinerary: string[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  activities: TripActivity[];
  onMarkerNavigate: (activity: TripActivity) => void;
}

export default function GenerateItinerary({
  destination,
  duration,
  onItineraryGenerated,
  loading,
  setLoading,
  activities,
  onMarkerNavigate
}: GenerateItineraryProps) {
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const result = await generateTripPlan({
        destination: destination,
        duration: duration,
        budget: 1500,
        preferences: ["food", "culture", "exploring"],
      });
      console.log("AI RESULT:", result);
      onItineraryGenerated(result.itinerary);
      setLoading(false);
    } catch (err) {
      console.log("AI ERROR:", err);
      setLoading(false);
    }
  };

  const mapActivities = activities.filter(
    (a) => typeof a.latitude === "number" && typeof a.longitude === "number",
  );

  const computeRegion = (): Region => {
    if (mapActivities.length === 0) {
      return {
        latitude: 25.7617,
        longitude: -80.1918,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      };
    }

    const lats = mapActivities.map((a) => a.latitude as number);
    const lngs = mapActivities.map((a) => a.longitude as number);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;

    // padding
    const latitudeDelta = Math.max(0.02, (maxLat - minLat) * 1.6);
    const longitudeDelta = Math.max(0.02, (maxLng - minLng) * 1.6);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
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

  return (
    <View className="bg-neutral-surface rounded-lg">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-neutral-textPrimary">
          Generate Itinerary
        </Text>
      </View>

      {/* Trip Map */}
      <View className="rounded-lg overflow-hidden mb-4 border border-neutral-divider bg-neutral-surface">
        <View className="px-4 py-3 border-b border-neutral-divider">
          <Text className="text-neutral-textPrimary font-semibold">
            Trip Map
          </Text>
          <Text className="text-neutral-textSecondary text-xs mt-1">
            {mapActivities.length > 0
              ? `${mapActivities.length} pinned activities`
              : "No pinned activities yet"}
          </Text>
        </View>

        <View style={{ height: 180 }}>
          {mapActivities.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-neutral-textSecondary">
                Add a location to pin activities
              </Text>
            </View>
          ) : (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={computeRegion()}
            >
              {mapActivities.map((a) => (
                <Marker
                  key={a.id}
                  coordinate={{
                    latitude: a.latitude as number,
                    longitude: a.longitude as number,
                  }}
                >
                  <Callout onPress={() => onMarkerNavigate(a)}>
                    <View style={{ maxWidth: 220 }}>
                      <Text style={{ fontWeight: "600" }}>
                        {(a.location_name ?? "Activity").split(",")[0]}
                      </Text>
                      {a.title ? (
                        <Text style={{ marginTop: 4, color: "#67717B" }}>
                          {a.title}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          marginTop: 6,
                          color: "#3A1FA8",
                          fontWeight: "600",
                        }}
                      >
                        Open activity details
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}
        </View>
      </View>

      {/* Generate Itinerary Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        className="mb-6 w-full"
        onPress={handleGenerate}
      >
        <LinearGradient
          colors={["#D81E5B", "#FF4D4D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="px-4 py-3 rounded-lg items-center">
            <Text className="text-white font-semibold">
              Generate Itinerary
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {loading && (
        <Text className="text-blue-500 mb-4 font-semibold">
          🤖 Generating AI itinerary...
        </Text>
      )}
    </View>
  );
}
