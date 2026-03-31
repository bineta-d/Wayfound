import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import MapView, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { Activity as TripActivity } from "../../../lib/TripService";

interface TripMapProps {
  activities: TripActivity[];
  onMarkerNavigate: (activity: TripActivity) => void;
  fullHeight?: boolean;
}

interface GenerateItineraryProps {
  tripId: string;
  startDate: string;
  endDate: string;
  destination: string;
  duration: number;
  onItineraryGenerated: (itinerary: string[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}
export default function TripMap(props: TripMapProps & Partial<GenerateItineraryProps>) {
  const {
    activities = [],
    onMarkerNavigate = () => { },
    fullHeight = false,
    tripId,
    startDate,
    endDate,
    destination,
    duration,
    onItineraryGenerated,
    loading,
    setLoading,
  } = props;
  const router = useRouter();

  const mapRef = useRef<MapView | null>(null);

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

  const handleZoom = (factor: number) => {
    const region = computeRegion();

    mapRef.current?.animateToRegion(
      {
        ...region,
        latitudeDelta: Math.max(0.002, region.latitudeDelta * factor),
        longitudeDelta: Math.max(0.002, region.longitudeDelta * factor),
      },
      250,
    );
  };

  const handleZoomIn = () => handleZoom(0.6);
  const handleZoomOut = () => handleZoom(1.6);

  return (
    <View
      className="rounded-lg overflow-hidden mb-4 border border-neutral-divider bg-neutral-surface"
      style={fullHeight ? { flex: 1, marginBottom: 0 } : undefined}
    >
      <View className="px-4 py-3 border-b border-neutral-divider">
        <Text className="text-neutral-textPrimary font-semibold">Trip Map</Text>
        <Text className="text-neutral-textSecondary text-xs mt-1">
          {mapActivities.length > 0
            ? `${mapActivities.length} pinned activities`
            : "No pinned activities yet"}
        </Text>
      </View>

      <View style={fullHeight ? { flex: 1 } : { height: 180 }}>
        {mapActivities.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-neutral-textSecondary">
              Add a location to pin activities
            </Text>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
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

            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                right: 16,
                top: 16,
                zIndex: 20,
                elevation: 20,
              }}
            >
              <TouchableOpacity
                onPress={handleZoomIn}
                activeOpacity={0.9}
                style={{
                  width: 52,
                  height: 52,
                  backgroundColor: "rgba(255,255,255,0.96)",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#2A2E34" }}>+</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleZoomOut}
                activeOpacity={0.9}
                style={{
                  width: 52,
                  height: 52,
                  backgroundColor: "rgba(255,255,255,0.96)",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#2A2E34" }}>−</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <>
        {/* <TouchableOpacity
          activeOpacity={0.9}
          className="mb-6 w-full"
          onPress={() => {
            router.push(
              `/ai-planner?tripId=${tripId}&destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}` as any,
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
        </TouchableOpacity> */}
      </>
    </View>
  );
}
