import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
    // Navigate to trip details (to be implemented)
    console.log('Trip pressed:', trip);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading trips...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-6">
        <Text className="text-2xl font-bold text-gray-800">Your Trips</Text>
        <Text className="text-gray-600 mt-2">Manage your travel plans</Text>
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
            <TouchableOpacity
              key={trip.id}
              onPress={() => handleTripPress(trip)}
              className="bg-white rounded-lg p-4 mb-3 shadow-sm"
            >
              <Text className="text-lg font-semibold text-gray-800">{trip.title}</Text>
              <Text className="text-gray-600 mt-1">{trip.destination}</Text>
              <View className="flex-row mt-2">
                <Text className="text-sm text-gray-500">
                  {trip.start_date} - {trip.end_date}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
