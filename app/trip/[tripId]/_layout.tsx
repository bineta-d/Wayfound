import { Stack } from 'expo-router';

export default function TripLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Trip Overview' }} />
            <Stack.Screen name="itinerary" options={{ title: 'Itinerary' }} />
            <Stack.Screen name="budget" options={{ title: 'Budget' }} />
            <Stack.Screen name="map" options={{ title: 'Map' }} />
            <Stack.Screen name="bookings" options={{ title: 'Bookings' }} />
            <Stack.Screen name="collaborators" options={{ title: 'Collaborators' }} />
        </Stack>
    );
}
