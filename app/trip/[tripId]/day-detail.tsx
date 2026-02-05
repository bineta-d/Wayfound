import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DayDetailScreen() {
  const { tripId, day } = useLocalSearchParams();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Trip Header */}
      <View className="bg-white px-6 py-6 mb-2">
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-600 mr-2">📍</Text>
          <Text className="text-gray-700 text-lg">Destination</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-gray-600 mr-2">📅</Text>
          <Text className="text-gray-700">Day {day} - Date</Text>
        </View>
      </View>

      {/* Map Section */}
      <View className="bg-white px-6 py-6 mb-2">
        <Text className="text-xl font-bold text-gray-800 mb-4">Trip Map</Text>
        <View className="bg-gray-200 rounded-lg h-48 items-center justify-center mb-4">
          <Text className="text-gray-600 text-center mb-2">🗺️</Text>
          <Text className="text-gray-700 text-center font-medium">
            Interactive Map
          </Text>
          <Text className="text-gray-500 text-sm">
            Google Maps integration coming soon
          </Text>
        </View>
      </View>

      {/* Activities Section */}
      <View className="bg-white px-6 py-6 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">Activities</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => console.log("Add activity pressed")}
          >
            <Text className="text-white font-semibold">+ Add Activity</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <Text className="text-gray-500 text-center">
            No activities added yet
          </Text>
        </View>
      </View>

      {/* Generate Itinerary Button */}
      <View className="px-6 py-4 mb-8">
        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg items-center"
          onPress={() => console.log("Generate itinerary pressed")}
        >
          <Text className="text-white font-semibold">Generate Itinerary</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
