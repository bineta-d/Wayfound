import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack
      initialRouteName="createTrip"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="createTrip" />
    </Stack>
  );
}
