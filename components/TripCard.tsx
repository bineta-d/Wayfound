import { View, Text, TouchableOpacity, Image } from 'react-native';

interface TripCardProps {
    title: string;
    destination: string;
    date: string;
    onPress: () => void;
}

export default function TripCard({ title, destination, date, onPress }: TripCardProps) {
    return (
        <TouchableOpacity
            className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200"
            onPress={onPress}
        >
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold flex-1">{title}</Text>
                <Text className="text-sm text-gray-500">{date}</Text>
            </View>

            <View className="flex-row items-center">
                <Text className="text-gray-600 mr-2">📍</Text>
                <Text className="text-gray-600">{destination}</Text>
            </View>
        </TouchableOpacity>
    );
}
