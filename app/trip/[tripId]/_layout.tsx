import { Stack } from "expo-router";

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="itinerary" options={{ title: "Itinerary", headerShown: true }} />
      <Stack.Screen name="day-detail" />
      <Stack.Screen name="budget" options={{ title: "Budget", headerShown: true }} />
      <Stack.Screen name="map" options={{ title: "Map", headerShown: true }} />
      <Stack.Screen name="bookings" options={{ title: "Bookings", headerShown: true }} />
      <Stack.Screen name="collaborators" options={{ title: "Collaborators", headerShown: true }} />
    </Stack>
  );
}
