import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import TripCard from '../../components/TripCard';
import TripCardSkeleton from '../../components/TripCardSkeleton';
import { useAuth } from '../../context/AuthContext';
import { getSharedTrips } from '../../lib/TripService';
import { Trip } from '../../lib/types';

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
            console.log('🔍 Collaborate: Starting to load shared trips...');
            const trips = await getSharedTrips(user);
            console.log('🔍 Collaborate: Received trips:', trips);
            console.log('🔍 Collaborate: Trips type:', typeof trips);
            console.log('🔍 Collaborate: Trips length:', trips?.length || 0);
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
            <Stack.Screen options={{ title: "Collaborate", headerShown: true }} />
            <ScrollView className="flex-1 bg-neutral-background">
                <View className="px-6 pt-12 pb-6 bg-neutral-background">
                    <View className="mb-3">
                        <Text className="text-2xl font-bold text-primary-midnightIndigo">Shared Trips</Text>
                        <View className="h-1 w-12 bg-accent-hotCoral mt-1 rounded-full" />
                    </View>
                    <Text className="text-neutral-textSecondary mt-1">Trips shared with you</Text>
                </View>

                <View className="px-6 py-4">
                    {(() => {
                        console.log('🔍 Collaborate Render: sharedTrips.length =', sharedTrips.length);
                        return null;
                    })()}
                    {sharedTrips.length === 0 ? (
                        <>
                            {(() => {
                                console.log('🔍 Collaborate Render: Showing No shared trips message');
                                return null;
                            })()}
                            <View className="bg-neutral-surface rounded-lg p-6 items-center">
                                <Text className="text-neutral-textSecondary text-center mb-4">No shared trips yet</Text>
                                <Text className="text-neutral-textSecondary text-center text-sm">
                                    When someone adds you to a trip, it will appear here
                                </Text>
                            </View>
                        </>
                    ) : (
                        <>
                            {(() => {
                                console.log('🔍 Collaborate Render: Rendering', sharedTrips.length, 'trip cards');
                                return null;
                            })()}
                            {sharedTrips.map((trip) => {
                                console.log('🔍 Collaborate Render: Rendering trip:', trip);
                                return (
                                    <TripCard
                                        key={trip.id}
                                        title={trip.title}
                                        destination={trip.destination}
                                        date={`${trip.start_date} - ${trip.end_date}`}
                                        onPress={() => handleTripPress(trip)}
                                    />
                                );
                            })}
                        </>
                    )}
                </View>
            </ScrollView>
        </>
    );
}
