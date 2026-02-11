import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import TripCard from '../../components/TripCard';
import { useAuth } from '../../context/AuthContext';
import { getUserTrips } from '../../lib/TripService';
import { Trip } from '../../lib/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
  };

  const handleTripPress = (trip: Trip) => {
    router.push(`/trip/${trip.id}`);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Home", headerShown: true }} />
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-gray-600">Loading trips...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Home", headerShown: true }} />
      <ScrollView className="flex-1 bg-gray-50">
        <View className="bg-white px-6 pt-12 pb-6">
          <Text className="text-2xl font-bold text-gray-800">Your Trips</Text>
          <Text className="text-gray-600 mt-2">Manage your travel plans</Text>
          <Button 
  title="Test Scanner" 
  onPress={() => router.push('/screens/ScannerScreen')} 
/>
        </View>

        <View className="px-6 py-4">
          {trips.length === 0 ? (
            <View className="bg-white rounded-lg p-6 items-center">
              <Text className="text-gray-500 text-center mb-4">No trips yet</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/create')}
                className="bg-blue-500 px-6 py-3 rounded-lg"
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
