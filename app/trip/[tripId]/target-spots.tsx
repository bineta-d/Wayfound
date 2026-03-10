import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { addTripActivityToDay, getPlaceDetails, PlacePrediction, searchPlacePredictions } from "../../../lib/TripService";

interface TargetSpotsProps {
  targetSpots: string[];
  onAddSpot: (spot: string) => void;
  onRemoveSpot: (index: number) => void;
  activities: any[];
  onAssignToDay: (activity: any, dayNumber: number) => void;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  onRefresh: () => void;
}

export default function TargetSpots({
  targetSpots,
  onAddSpot,
  onRemoveSpot,
  activities,
  onAssignToDay,
  tripId,
  tripStartDate,
  tripEndDate,
  onRefresh,
}: TargetSpotsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [googlePlaces, setGooglePlaces] = useState<PlacePrediction[]>([]);
  const [showDayAssignModal, setShowDayAssignModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [tripDays, setTripDays] = useState<Array<{ dayNumber: number; date: string }>>([]);

  // Generate trip days when component mounts
  useEffect(() => {
    if (tripStartDate && tripEndDate) {
      const start = new Date(tripStartDate);
      const end = new Date(tripEndDate);
      const days = [];
      const current = new Date(start);

      while (current <= end) {
        days.push({
          dayNumber: days.length + 1,
          date: current.toISOString().split('T')[0]
        });
        current.setDate(current.getDate() + 1);
      }
      setTripDays(days);
    }
  }, [tripStartDate, tripEndDate]);

  const handleAddSpot = () => {
    setShowAddModal(true);
  };

  // Search Google Places when text changes
  const handleSearchChange = async (text: string) => {
    setSearchText(text);
    if (text.trim().length > 2) {
      try {
        const predictions = await searchPlacePredictions(text);
        setGooglePlaces(predictions);
      } catch (error) {
        console.error('Error searching places:', error);
        setGooglePlaces([]);
      }
    } else {
      setGooglePlaces([]);
    }
  };

  // Handle place selection from Google Places
  const handlePlaceSelect = async (place: PlacePrediction) => {
    try {
      const placeDetails = await getPlaceDetails(place.place_id);
      // Add the place to targetSpots list immediately
      onAddSpot(placeDetails.location_name);
      // Store the full place details for potential day assignment
      setSelectedPlace(placeDetails);
      setSearchText(place.description);
      setGooglePlaces([]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  // Handle assignment to a specific day
  const handleDayAssign = async (day: { dayNumber: number; date: string }) => {
    if (selectedPlace && tripId) {
      try {
        const activityData = {
          trip_id: tripId,
          day_date: day.date,
          location_name: selectedPlace.location_name,
          latitude: selectedPlace.latitude || null,
          longitude: selectedPlace.longitude || null,
        };

        await addTripActivityToDay(activityData);

        // Always remove the spot from targetSpots when assigned to a day
        const spotIndex = targetSpots.findIndex(spot => spot === selectedPlace.location_name);
        if (spotIndex !== -1) {
          onRemoveSpot(spotIndex);
        }

        // Reset states and refresh
        setSelectedPlace(null);
        setShowDayAssignModal(false);
        setShowAddModal(false);
        setSearchText('');
        onRefresh();
      } catch (error) {
        console.error('Error adding activity to day:', error);
      }
    }
  };

  // Fallback function for manual text input (if Google Places fails)
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
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPlace({ location_name: spot });
                      setShowDayAssignModal(true);
                    }}
                    className="mr-3"
                  >
                    <Ionicons name="help-circle" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onRemoveSpot(index)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
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
          <SafeAreaView
            className="w-full bg-white rounded-t-3xl shadow-lg"
            style={{ height: '50%' }}
          >
            <View className="flex-row justify-between items-center mb-4 pt-6 px-6">
              <Text className="text-lg font-semibold text-neutral-textPrimary">
                Add Target Spot
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-1 px-6">
              <TextInput
                className="border border-neutral-divider rounded-lg p-3 mb-4 bg-neutral-surface"
                placeholder="Search for a place..."
                value={searchText}
                onChangeText={handleSearchChange}
                autoFocus={true}
              />

              {/* Google Places Results - fills all remaining space */}
              {googlePlaces.length > 0 && (
                <View className="flex-1">
                  <FlatList
                    data={googlePlaces}
                    keyExtractor={(item: PlacePrediction) => item.place_id}
                    renderItem={({ item }: { item: PlacePrediction }) => (
                      <TouchableOpacity
                        onPress={() => handlePlaceSelect(item)}
                        className="p-3 border-b border-gray-200 bg-gray-50"
                      >
                        <Text className="text-neutral-textPrimary">{item.description}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

            {/* Fixed Bottom Button */}
            <View className="px-6 pb-4">
              <TouchableOpacity
                className="bg-blue-500 rounded-lg p-4"
                onPress={handleModalAdd}
              >
                <Text className="text-center text-white font-semibold">
                  Add Target Spot
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Day Assignment Modal */}
      <Modal
        visible={showDayAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayAssignModal(false)}
      >
        <View className="flex-1 justify-end">
          <View className="w-full h-2/3 bg-white rounded-t-3xl p-6 shadow-lg">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-neutral-textPrimary">
                Assign to Day
              </Text>
              <TouchableOpacity onPress={() => setShowDayAssignModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-textSecondary mb-4">
              Select which day to add "{selectedPlace?.location_name || 'this location'}"
            </Text>

            <ScrollView className="flex-1">
              <View className="space-y-2">
                {tripDays.map((day) => (
                  <TouchableOpacity
                    key={day.dayNumber}
                    onPress={() => handleDayAssign(day)}
                    className="bg-neutral-surface p-4 rounded-lg border border-neutral-divider"
                  >
                    <Text className="text-neutral-textPrimary font-medium">
                      Day {day.dayNumber}
                    </Text>
                    <Text className="text-neutral-textSecondary text-sm">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
