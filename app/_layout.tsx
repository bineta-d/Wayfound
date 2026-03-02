import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import AuthGate from "./AuthGate";
import "../global.css";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!loaded) return;
      try {
        await SplashScreen.hideAsync();
      } catch {
        // ignore: can happen during fast refresh or if splash isn't registered
      }
    };

    run();
  }, [loaded]);

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

  // For now, we'll handle onboarding in the auth state change listener
  console.log("🔍 AuthStack: User authenticated, showing main app with AuthGate");
  return (
    <Stack>
      {/* Auth + Main */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="AuthGate" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Trip routes */}
      <Stack.Screen name="trip/[tripId]" options={{ headerShown: true }} />
      <Stack.Screen
        name="trip/[tripId]/day-detail"
        options={{ headerShown: true, title: "Day Details" }}
      />

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
  );
}
