import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSharedTrips } from '../../lib/TripService';
import { Trip } from '../../lib/types';
import TripCard from '../../components/TripCard';
import { Stack } from 'expo-router';

export default function CollaborateScreen() {
    const { user } = useAuth();
    const [sharedTrips, setSharedTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadSharedTrips();
        }
    }, [user]);

    const loadSharedTrips = async () => {
        if (!user) return;

        try {
            const trips = await getSharedTrips(user);
            setSharedTrips(trips);
        } catch (error) {
            console.error('Error loading shared trips:', error);
            Alert.alert('Error', 'Failed to load shared trips');
        } finally {
            setLoading(false);
        }
    };

    const handleTripPress = (trip: Trip) => {
        console.log('Shared trip pressed:', trip);
        // TODO: Navigate to trip details
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ title: "Collaborate", headerShown: true }} />
                <View className="flex-1 items-center justify-center bg-white">
                    <Text className="text-gray-600">Loading shared trips...</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: "Collaborate", headerShown: true }} />
            <ScrollView className="flex-1 bg-gray-50">
                <View className="bg-white px-6 pt-12 pb-6">
                    <Text className="text-2xl font-bold text-gray-800">Shared Trips</Text>
                    <Text className="text-gray-600 mt-2">Trips shared with you</Text>
                </View>

                <View className="px-6 py-4">
                    {sharedTrips.length === 0 ? (
                        <View className="bg-white rounded-lg p-6 items-center">
                            <Text className="text-gray-500 text-center mb-4">No shared trips yet</Text>
                            <Text className="text-gray-400 text-center text-sm">
                                When someone adds you to a trip, it will appear here
                            </Text>
                        </View>
                    ) : (
                        sharedTrips.map((trip) => (
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
