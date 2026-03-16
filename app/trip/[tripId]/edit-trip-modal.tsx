import React, { useState, useEffect } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, Trip_member } from '../../../lib/types';
import { Ionicons } from '@expo/vector-icons';

interface EditTripModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedTrip: Partial<Trip>) => void;
  trip: Trip;
  members: Trip_member[];
}

export default function EditTripModal({
  visible,
  onClose,
  onSave,
  trip,
  members,
}: EditTripModalProps) {
  const [title, setTitle] = useState(trip.title);
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [destination, setDestination] = useState(trip.destination);
  const [budget, setBudget] = useState(trip.budget?.toString() || '');

  useEffect(() => {
    if (visible) {
      setTitle(trip.title);
      setStartDate(trip.start_date);
      setEndDate(trip.end_date);
      setDestination(trip.destination);
      setBudget(trip.budget?.toString() || '');
    }
  }, [visible, trip]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a trip title');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const updatedTrip: Partial<Trip> = {
      title: title.trim(),
      start_date: startDate,
      end_date: endDate,
      destination: destination.trim(),
      budget: budget ? parseFloat(budget) : undefined,
    };

    onSave(updatedTrip);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-800">Edit Trip</Text>
          <TouchableOpacity onPress={handleSave} className="bg-blue-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Title */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">Trip Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter trip title"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          {/* Destination */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">Destination</Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Enter destination"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          {/* Dates */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">Start Date</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 mb-4"
            />
            
            <Text className="text-gray-700 text-sm font-medium mb-2">End Date</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          {/* Budget */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">Budget (Optional)</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="Enter budget amount"
              keyboardType="numeric"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          {/* Collaborators Section */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">Collaborators ({members.length})</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-4">
              {members.length === 0 ? (
                <Text className="text-gray-500 text-sm">No collaborators added yet</Text>
              ) : (
                members.map((member, index) => (
                  <View key={member.id} className="flex-row items-center py-2 border-b border-gray-100">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 font-medium text-sm">
                        {member.users?.full_name?.[0] || member.name?.[0] || '?'}
                      </Text>
                    </View>
                    <Text className="text-gray-800 flex-1">
                      {member.users?.full_name || member.name || 'Unknown User'}
                    </Text>
                    <Text className="text-gray-500 text-xs capitalize">
                      {member.role}
                    </Text>
                  </View>
                ))
              )}
            </View>
            <Text className="text-gray-500 text-xs mt-2">
              Collaborator management coming soon
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
