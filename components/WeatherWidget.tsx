import { View, Text } from 'react-native';

export default function WeatherWidget() {
    return (
        <View className="bg-blue-100 rounded-lg p-4">
            <Text className="text-sm text-gray-600 mb-1">Current Weather</Text>
            <Text className="text-2xl font-bold text-blue-600">72°F</Text>
            <Text className="text-sm text-gray-500">Sunny</Text>
            <Text className="text-xs text-gray-400 mt-1">New York, NY</Text>
        </View>
    );
}
