import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import TripCard from '../../components/TripCard';
import TripCardSkeleton from '../../components/TripCardSkeleton';
import { useAuth } from '../../context/AuthContext';
import { getUserTrips } from '../../lib/TripService';
import { Trip } from '../../lib/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserTrips();
    }
  }, [user]);

  const loadUserTrips = async () => {
    if (!user) return;

    try {
      const userTrips = await getUserTrips(user);
      setTrips(userTrips || []);
    } catch (error) {
      console.error('Error loading trips:', error);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserTrips();
  };

  const handleTripPress = (trip: Trip) => {
    router.push(`/trip/${trip.id}`);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Home", headerShown: true }} />
        <View className="flex-1 bg-neutral-background px-6 py-6">
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Home", headerShown: true }} />
      <ScrollView
        className="flex-1 bg-neutral-background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 pt-12 pb-6 bg-neutral-background">
          <View className="mb-3">
            <Text className="text-2xl font-bold text-primary-midnightIndigo">Your Trips</Text>
            <View className="h-1 w-12 bg-accent-hotCoral mt-1 rounded-full" />
          </View>
          <Text className="text-neutral-textSecondary mt-1">Manage your travel plans</Text>
        </View>

        <View className="px-6 py-4">
          {trips.length === 0 ? (
            <View className="bg-neutral-surface rounded-lg p-6 items-center">
              <Text className="text-neutral-textSecondary text-center mb-4">No trips yet</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/create')}
                className="bg-primary-royalPurple px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Create Your First Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            trips.map((trip) => (
              <TripCard
                key={trip.id}
                title={trip.title}
                destination={trip.destination}
                date={`${trip.start_date} - ${trip.end_date}`}
                onPress={() => handleTripPress(trip)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}
