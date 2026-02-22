import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import OnboardingSwiper from '../components/OnboardingSwiper';

export default function AuthGate() {
  const { user, loading, checkProfileComplete } = useAuth();
  const router = useRouter();
  const [profileCheckLoading, setProfileCheckLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, check profile completeness
      checkUserProfile();
    } else if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  const checkUserProfile = async () => {
    if (!user?.id) return;
    
    setProfileCheckLoading(true);
    const result = await checkProfileComplete(user.id);
    
    setProfileComplete(result.isComplete);
    setUserProfile(result.profile);
    setProfileCheckLoading(false);

    if (result.isComplete) {
      // Profile is complete, redirect to home
      router.replace('/(tabs)/home');
    }
    // If profile is incomplete, stay on this screen to show onboarding
  };

  if (loading || profileCheckLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    // This should be handled by the redirect above, but just in case
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Redirecting to login...</Text>
      </View>
    );
  }

  if (profileComplete === false && userProfile) {
    // Show onboarding for incomplete profiles
    return (
      <OnboardingSwiper
        userId={user.id}
        email={userProfile.email || user.email || ''}
        fullName={userProfile.full_name || ''}
        avatarUrl={userProfile.avatar_url || ''}
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-gray-600">Preparing your experience...</Text>
    </View>
  );
}
