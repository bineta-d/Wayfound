import React from 'react';
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export default function Collaboration() {
  return (
    <View className="bg-neutral-surface rounded-lg p-4 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-neutral-textPrimary">
          Collaboration
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="people" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View className="space-y-3">
        <View className="bg-neutral-background rounded-lg p-3">
          <Text className="text-sm text-neutral-textSecondary mb-2">Trip Members</Text>
          <View className="flex-row items-center">
            <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mr-2">
              <Text className="text-blue-600 text-xs font-semibold">JD</Text>
            </View>
            <View className="bg-green-100 w-8 h-8 rounded-full items-center justify-center mr-2">
              <Text className="text-green-600 text-xs font-semibold">SM</Text>
            </View>
            <View className="bg-purple-100 w-8 h-8 rounded-full items-center justify-center mr-2">
              <Text className="text-purple-600 text-xs font-semibold">AK</Text>
            </View>
            <TouchableOpacity className="bg-neutral-200 w-8 h-8 rounded-full items-center justify-center">
              <Ionicons name="add" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row space-x-2">
          <TouchableOpacity className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Text className="text-blue-600 text-center font-medium text-sm">
              Share Trip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <Text className="text-neutral-textPrimary text-center font-medium text-sm">
              View Activity
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-neutral-background rounded-lg p-3">
          <Text className="text-sm text-neutral-textSecondary mb-1">Recent Activity</Text>
          <Text className="text-xs text-neutral-textPrimary">
            John added "Miami Beach" to target spots • 2h ago
          </Text>
          <Text className="text-xs text-neutral-textPrimary mt-1">
            Sarah updated Day 2 itinerary • 5h ago
          </Text>
        </View>
      </View>
    </View>
  );
}
