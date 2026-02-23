import { Ionicons } from "@expo/vector-icons";
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface TargetSpotsProps {
  targetSpots: string[];
  onAddSpot: (spot: string) => void;
  onRemoveSpot: (index: number) => void;
  activities: any[];
  onAssignToDay: (activity: any, dayNumber: number) => void;
}

export default function TargetSpots({ targetSpots, onAddSpot, onRemoveSpot, activities, onAssignToDay }: TargetSpotsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [googlePlaces, setGooglePlaces] = useState([]);

  const handleAddSpot = () => {
    setShowAddModal(true);
  };

  const handleModalAdd = () => {
    if (searchText.trim()) {
      onAddSpot(searchText.trim());
      setSearchText('');
      setShowAddModal(false);
    }
  };

  const parseLocationName = (locationName: string) => {
    // Parse Google address to get the main location name
    if (!locationName) return 'Unknown Location';

    // Split by comma and take the first part (usually the main location name)
    const parts = locationName.split(',');
    return parts[0].trim();
  };

  const getDayNumberForActivity = (activity: any) => {
    if (!activity.day_date) return 1;

    const startDate = new Date(activity.day_date);
    const tripStart = new Date(activity.trip_start_date || startDate);
    const diffTime = startDate.getTime() - tripStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 ? diffDays + 1 : 1;
  };

  return (
    <View className="bg-neutral-surface rounded-lg p-4 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-neutral-textPrimary">
          Target Spots
        </Text>
        <TouchableOpacity onPress={handleAddSpot}>
          <Ionicons name="add-circle" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Individual Activities List */}
      {activities.length === 0 && targetSpots.length === 0 ? (
        <Text className="text-neutral-textSecondary text-sm mb-3">
          Add places you want to visit during your trip
        </Text>
      ) : (
        <ScrollView className="max-h-96">
          <View className="space-y-2">
            {/* Show individual activities */}
            {activities.map((activity, index) => (
              <View
                key={activity.id || index}
                className="flex-row justify-between items-center bg-neutral-background p-3 rounded-lg"
              >
                <Text className="text-neutral-textPrimary flex-1">
                  {parseLocationName(activity.location_name)}
                </Text>
                <TouchableOpacity
                  onPress={() => onAssignToDay(activity, getDayNumberForActivity(activity))}
                  className="ml-3"
                >
                  <Ionicons name="calendar" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Show manually added target spots */}
            {targetSpots.map((spot, index) => (
              <View
                key={`manual-${index}`}
                className="flex-row justify-between items-center bg-neutral-background p-3 rounded-lg"
              >
                <Text className="text-neutral-textPrimary flex-1">
                  {spot}
                </Text>
                <TouchableOpacity onPress={() => onRemoveSpot(index)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Target Spot Button */}
      <TouchableOpacity
        className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3"
        onPress={handleAddSpot}
      >
        <Text className="text-blue-600 text-center font-medium">
          + Add Target Spot
        </Text>
      </TouchableOpacity>

      {/* Google Places Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end">
          <View className="w-full h-1/4 bg-white rounded-t-3xl p-6 shadow-lg">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-neutral-textPrimary">
                Add Target Spot
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="border border-neutral-divider rounded-lg p-3 mb-4 bg-neutral-surface"
              placeholder="Search for a place..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
            />

            <TouchableOpacity
              className="bg-blue-500 rounded-lg p-4"
              onPress={handleModalAdd}
            >
              <Text className="text-center text-white font-semibold">
                Add Target Spot
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
