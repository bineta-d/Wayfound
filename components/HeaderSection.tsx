import { Trip } from "@/lib/types";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function HeaderSection({
  title,
  trip,
}: {
  title: string;
  trip: Trip;
}) {
  return (
    <View className="bg-white px-6 py-6 border-b border-gray-200">
      <Text className="text-3xl font-bold text-gray-800 mb-2">
        {title || trip.title}
      </Text>
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
          {new Date(trip.start_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {new Date(trip.end_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
}
