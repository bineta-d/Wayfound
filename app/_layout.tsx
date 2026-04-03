import { supabase } from "@/lib/supabase";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DefaultTheme,
  ThemeProvider
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "AuthGate",
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <AuthStack />
      </ThemeProvider>
    </AuthProvider>
  );
}

function AuthStack() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (user && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return null;
  }

  if (!user) {
    console.log("🔍 AuthStack: No user found, redirecting to login");
    return (
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="AuthGate" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // Check if user needs onboarding (Google OAuth users without profile)
  const checkOnboardingNeeded = async () => {
    if (user?.app_metadata?.provider === 'google') {
      const { data: profile } = await supabase
        .from('users')
        .select('id, full_name, dob')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.dob) {
        console.log("🔍 AuthStack: Google user needs onboarding");
        return true;
      }
    }
    return false;
  };

  console.log("🔍 AuthStack: User authenticated, showing main app with AuthGate");
  return (
    <GestureHandlerRootView>
      <Stack>
        {/* Auth + Main */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="AuthGate" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Trip routes */}
        <Stack.Screen name="trip/[tripId]" options={{ headerShown: false }} />

        {/* Modals */}
        <Stack.Screen
          name="modal/add-activity"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="modal/create-trip"
          options={{ presentation: "modal", headerShown: false }}
        />

        {/* Other screens */}
        <Stack.Screen
          name="screens/editProfile"
          options={{
            title: "Edit Profile",
            headerShown: true,
            headerBackTitle: "",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
