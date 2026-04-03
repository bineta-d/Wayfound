import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trip, Trip_member } from "../../../lib/types";

// Date picker component
const DatePicker = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder: string;
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
      >
        <Text className="text-gray-800">{value || placeholder}</Text>
      </TouchableOpacity>

      {showPicker && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-4">
            <View className="bg-white rounded-2xl p-4 w-full max-w-sm">
              <Text className="text-lg font-semibold mb-4 text-gray-800">
                Select Date
              </Text>
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event: any, selected?: Date) => {
                  if (Platform.OS === "android") {
                    setShowPicker(false);
                  }
                  if (selected) {
                    onChange(selected.toISOString().split("T")[0]);
                  }
                }}
                style={{ width: "100%" }}
              />
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="bg-blue-500 px-4 py-2 rounded-lg mt-4"
              >
                <Text className="text-white font-medium text-center">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

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
  const [budget, setBudget] = useState(trip.budget?.toString() || "");
  const [collaborators, setCollaborators] = useState<Trip_member[]>(members);

  const resetToOriginal = () => {
    setTitle(trip.title);
    setStartDate(trip.start_date);
    setEndDate(trip.end_date);
    setDestination(trip.destination);
    setBudget(trip.budget?.toString() || "");
    setCollaborators(members);
  };

  useEffect(() => {
    if (visible) {
      resetToOriginal();
    }
  }, [visible, trip]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a trip title");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Error", "Please select start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert("Error", "End date must be after start date");
      return;
    }

    const updatedTrip: Partial<Trip> = {
      title: title.trim(),
      start_date: startDate,
      end_date: endDate,
      destination: destination.trim(),
      budget: budget || undefined,
    };

    onSave(updatedTrip);
    onClose();
    Alert.alert("Success", "Trip updated successfully!");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      statusBarTranslucent={false}
    >
      <SafeAreaView className="flex-1 bg-gray-50 h-[95%]">
        <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-800">Edit Trip</Text>
          <TouchableOpacity onPress={resetToOriginal}>
            <Ionicons name="refresh" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView className="flex-1 px-6 py-6 pb-0">
          {/* Title */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">
              Trip Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter trip title"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          {/* Destination */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">
              Destination
            </Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Enter destination"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
            />
          </View>

          {/* Dates */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">
              Start Date
            </Text>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date"
            />

            <Text className="text-gray-700 text-sm font-medium mb-2">
              End Date
            </Text>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end date"
            />
          </View>

          {/* Budget */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">
              Budget (Optional)
            </Text>
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
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 text-sm font-medium">
                Collaborators ({members.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Add Collaborator",
                    "Add collaborator functionality coming soon!",
                  );
                }}
                className="bg-blue-500 px-3 py-1 rounded-lg"
              >
                <Text className="text-white text-sm font-medium">
                  Add Collaborator
                </Text>
              </TouchableOpacity>
            </View>
            <View className="bg-white border border-gray-300 rounded-lg p-4">
              {members.length === 0 ? (
                <Text className="text-gray-500 text-sm">
                  No collaborators added yet
                </Text>
              ) : (
                members.map((member, index) => (
                  <View
                    key={member.id}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 font-medium text-sm">
                        {member.users?.full_name?.[0] ||
                          member.name?.[0] ||
                          "?"}
                      </Text>
                    </View>
                    <Text className="text-gray-800 flex-1">
                      {member.users?.full_name || member.name || "Unknown User"}
                    </Text>
                    <Text className="text-gray-500 text-xs capitalize">
                      {member.role}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Remove Collaborator",
                          `Remove ${member.users?.full_name || member.name} functionality coming soon!`,
                        );
                      }}
                      className="ml-2"
                    >
                      <Ionicons
                        name="remove-circle"
                        size={16}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Save Button - Fixed at bottom within safe area */}
        <SafeAreaView
          className="bg-white px-6 py-4 border-t border-gray-200"
          edges={["bottom"]}
        >
          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-500 px-6 py-3 rounded-lg w-full"
          >
            <Text className="text-white font-medium text-center">
              Save Changes
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaView>
    </Modal>
  );
}
