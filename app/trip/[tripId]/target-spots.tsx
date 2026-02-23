import React from 'react';
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface TargetSpotsProps {
  targetSpots: string[];
  onAddSpot: (spot: string) => void;
  onRemoveSpot: (index: number) => void;
}

export default function TargetSpots({ targetSpots, onAddSpot, onRemoveSpot }: TargetSpotsProps) {
  const handleAddSpot = () => {
    // Simple add spot functionality - you can replace with modal later
    const spot = prompt("Add a target spot:");
    if (spot) onAddSpot(spot);
  };

  return (
    <View className="bg-neutral-surface rounded-lg p-4 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-neutral-textPrimary">
          Target Spots
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="add-circle" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {targetSpots.length === 0 ? (
        <Text className="text-neutral-textSecondary text-sm mb-3">
          Add places you want to visit during your trip
        </Text>
      ) : (
        <View className="space-y-2">
          {targetSpots.map((spot, index) => (
            <View
              key={index}
              className="flex-row justify-between items-center bg-neutral-background p-3 rounded-lg"
            >
              <Text className="text-neutral-textPrimary flex-1">
                • {spot}
              </Text>
              <TouchableOpacity onPress={() => onRemoveSpot(index)}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3"
        onPress={handleAddSpot}
      >
        <Text className="text-blue-600 text-center font-medium">
          + Add Target Spot
        </Text>
      </TouchableOpacity>
    </View>
  );
}
