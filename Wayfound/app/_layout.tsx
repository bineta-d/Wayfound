import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import AuthGate from "./AuthGate";
import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "AuthGate",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
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

  console.log("🔍 AuthStack: Component rendering");
  console.log("🔍 AuthStack: Loading state:", loading);
  console.log("🔍 AuthStack: User authenticated:", !!user);
  console.log("🔍 AuthStack: User email:", user?.email || "None");
  console.log(
    "🔍 AuthStack: Current route will be:",
    loading ? "Loading" : user ? "Main App" : "Login",
  );

  if (loading) {
    console.log("🔍 AuthStack: Showing loading state");
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
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="AuthGate" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trip" options={{ headerShown: true }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
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
