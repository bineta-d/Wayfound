import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import "../global.css";

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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

  console.log('🔍 AuthStack: Loading:', loading);
  console.log('🔍 AuthStack: User authenticated:', !!user);
  console.log('🔍 AuthStack: User email:', user?.email || 'None');

  if (loading) {
    console.log('🔍 AuthStack: Still loading auth state...');
    return null; // or a loading spinner
  }

  if (!user) {
    console.log('🔍 AuthStack: No user found, redirecting to login');
    return (
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Redirect href="/(auth)/login" />
      </Stack>
    );
  }

  console.log('🔍 AuthStack: User authenticated, showing main app');
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trip" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Redirect href="/(tabs)/home" />
    </Stack>
  );
}
