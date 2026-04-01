import { Activity } from "@/lib/TripService";
import React from "react";
import { Image, Text, View } from "react-native";

interface Props {
  activity: Activity;
}

export default function ActivityCard({ activity }: Props) {
  return (
    <View className="bg-white rounded-xl border border-neutral-divider overflow-hidden mb-3">

      {/* IMAGE */}
      {activity.photo ? (
        <Image
          source={{ uri: activity.photo }}
          className="w-full h-40"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-40 bg-neutral-200 items-center justify-center">
          <Text className="text-neutral-textSecondary">No image</Text>
        </View>
      )}

      {/* CONTENT */}
      <View className="p-4">

        {/* NAME */}
        <Text className="text-base font-semibold text-neutral-textPrimary">
          {activity.location_name ?? "Activity"}
        </Text>

        {/* RATING + CATEGORY */}
        <View className="flex-row items-center mt-1">
          {activity.rating && (
            <Text className="text-yellow-500 font-semibold mr-2">
              ⭐ {activity.rating.toFixed(1)}
            </Text>
          )}

          {activity.category && (
            <Text className="text-neutral-textSecondary text-xs">
              • {activity.category}
            </Text>
          )}
        </View>

        {/* DESCRIPTION */}
        {activity.description && (
          <Text
            className="text-neutral-textSecondary mt-2"
            numberOfLines={2}
          >
            {activity.description}
          </Text>
        )}
      </View>
    </View>
  );
}