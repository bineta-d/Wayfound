import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function BudgetScreen() {
    const { tripId } = useLocalSearchParams();

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <Text className="text-2xl font-bold mb-4">Budget</Text>
            <Text className="text-gray-600">Trip ID: {tripId}</Text>
            <Text className="text-gray-500 mt-4">Budget tracking and expenses coming soon</Text>
        </View>
    );
}
