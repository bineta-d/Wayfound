import { Trip } from "@/lib/types";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export default function HeaderSection({
  title,
  trip,
  onEditTrip,
}: {
  title: string;
  trip: Trip;
  onEditTrip?: () => void;
}) {
  return (
    <View className="bg-white px-6 py-6 border-b border-gray-200">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-3xl font-bold text-gray-800 flex-1">
          {title || trip.title}
        </Text>
        {onEditTrip && (
          <TouchableOpacity
            onPress={onEditTrip}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Edit Trip</Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row items-center mb-2 ">
        <MaterialIcons
          name="location-on"
          size={24}
          color="#D81E5B"
          className="pr-1"
        />
        <Text className="text-gray-700 text-lg">{trip.destination}</Text>
      </View>
      <View className="flex-row items-center">
        <MaterialIcons
          name="date-range"
          size={24}
          color="#D81E5B"
          className="pr-1"
        />
        <Text className="text-gray-700">
          {trip.start_date && new Date(trip.start_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {trip.end_date && new Date(trip.end_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
}
