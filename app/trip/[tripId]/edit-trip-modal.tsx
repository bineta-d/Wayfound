import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, Trip_member } from '../../../lib/types';

// Date range picker component
const DateRangePicker = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  placeholder
}: {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  placeholder: string;
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedStart, setSelectedStart] = useState(startDate ? new Date(startDate) : new Date());
  const [selectedEnd, setSelectedEnd] = useState(endDate ? new Date(endDate) : new Date());

  const isDateInRange = (date: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  };

  const isStartDate = (date: Date) => {
    const start = new Date(startDate);
    return date.toDateString() === start.toDateString();
  };

  const isEndDate = (date: Date) => {
    const end = new Date(endDate);
    return date.toDateString() === end.toDateString();
  };

  const handleDateSelect = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Set start date
      onStartChange(date.toISOString().split('T')[0]);
      setSelectedStart(date);
      setSelectedEnd(new Date());
    } else if (startDate && !endDate) {
      // Set end date
      onEndChange(date.toISOString().split('T')[0]);
      setSelectedEnd(date);
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
      >
        <Text className="text-gray-800">
          {startDate && endDate
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : placeholder
          }
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white rounded-2xl p-4 w-full max-w-sm">
            <Text className="text-lg font-semibold mb-4 text-gray-800">Select Date Range</Text>
            <CalendarPicker
              mode="calendar"
              date={selectedStart || new Date(startDate) || new Date()}
              onDateChange={handleDateSelect}
              maximumDate={new Date()}
              minimumDate={new Date()}
              themeVariant="light"
              textStyle={{
                color: '#000000',
                fontSize: 14,
              }}
              selectedDayTextColor="#FFFFFF"
              selectedDayBackgroundColor="#3B82F6"
              todayBackgroundColor="#F0F0F0"
              todayTextColor="#000000"
              width={280}
              height={320}
              customDatesStyles={[
                ...(startDate && endDate ? [
                  {
                    date: new Date(startDate),
                    style: { backgroundColor: '#10B981', borderRadius: 4 },
                    textStyle: { color: '#FFFFFF', fontWeight: 'bold' },
                  },
                  {
                    date: new Date(endDate),
                    style: { backgroundColor: '#3B82F6', borderRadius: 4 },
                    textStyle: { color: '#FFFFFF', fontWeight: 'bold' },
                  },
                  // Highlight all dates between start and end
                  ...(() => {
                    const dates = [];
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const current = new Date(start);

                    while (current <= end) {
                      dates.push({
                        date: new Date(current),
                        style: { backgroundColor: '#DBEAFE', borderRadius: 4 },
                        textStyle: { color: '#1E40AF', fontWeight: 'bold' },
                      });
                      current.setDate(current.getDate() + 1);
                    }
                    return dates;
                  })()
                ] : [])
              ]}
            />
            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="flex-1 bg-gray-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="flex-1 bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium text-center">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  const [budget, setBudget] = useState(trip.budget?.toString() || '');
  const [collaborators, setCollaborators] = useState<Trip_member[]>(members);

  const resetToOriginal = () => {
    setTitle(trip.title);
    setStartDate(trip.start_date);
    setEndDate(trip.end_date);
    setDestination(trip.destination);
    setBudget(trip.budget?.toString() || '');
    setCollaborators(members);
  };

  useEffect(() => {
    if (visible) {
      resetToOriginal();
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
      budget: budget || undefined,
    };

    onSave(updatedTrip);
    onClose();
    Alert.alert('Success', 'Trip updated successfully!');
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
            <Text className="text-gray-700 text-sm font-medium mb-2">Trip Dates</Text>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              placeholder="Select trip dates"
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
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 text-sm font-medium">Collaborators ({members.length})</Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Add Collaborator', 'Add collaborator functionality coming soon!');
                }}
                className="bg-blue-500 px-3 py-1 rounded-lg"
              >
                <Text className="text-white text-sm font-medium">Add Collaborator</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-white border border-gray-300 rounded-lg p-4">
              {members.length === 0 ? (
                <Text className="text-gray-500 text-sm">No collaborators added yet</Text>
              ) : (
                members.map((member, index) => (
                  <View key={member.id} className="flex-row items-center py-3 border-b border-gray-100">
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
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Remove Collaborator', `Remove ${member.users?.full_name || member.name} functionality coming soon!`);
                      }}
                      className="ml-2"
                    >
                      <Ionicons name="remove-circle" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Save Button - Fixed at bottom within safe area */}
        <SafeAreaView className="bg-white px-6 py-4 border-t border-gray-200" edges={["bottom"]}>
          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-500 px-6 py-3 rounded-lg w-full"
          >
            <Text className="text-white font-medium text-center">Save Changes</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaView>
    </Modal>
  );
}
