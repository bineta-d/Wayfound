import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack
      initialRouteName="createTrip"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="createTrip"
        options={{
          headerShown: true,
          title: "Create Trip",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen name="Newtrip" />
      <Stack.Screen
        name="editProfile"
        options={{
          headerShown: true,
          title: "Edit Profile",
          headerBackTitle: "",
        }}
      />
    </Stack>
  );
}
