import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ReservationsSection() {
  return (
    <View className="mb-4">
      {/* <Text className="text-lg font-bold text-neutral-textPrimary mb-2">Bookings</Text>
      <View className="mb-2">
        <Text className="font-semibold text-neutral-textSecondary mb-1">Accommodation</Text>
        <View className="bg-neutral-surface rounded-lg p-3 border border-neutral-divider">
          <Text className="text-neutral-textSecondary">Booking imports/extraction pending</Text>
        </View>
      </View>
      <View className="mb-2">
        <Text className="font-semibold text-neutral-textSecondary mb-1">Travel Info</Text>
        <View className="bg-neutral-surface rounded-lg p-3 border border-neutral-divider">
          <Text className="text-neutral-textSecondary">Booking imports/extraction pending</Text>
        </View>
      </View> */}
      {/* Reservation Icons */}
      <View className="flex-row mt-4">
        <TouchableOpacity className="items-center mr-6">
          <View className="bg-blue-100 p-3 rounded-full mb-1">
            <Ionicons name="bed" size={20} color="#3B82F6" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Accommodation</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center mr-6">
          <View className="bg-green-100 p-3 rounded-full mb-1">
            <Ionicons name="airplane" size={20} color="#10B981" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Flight</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center mr-6">
          <View className="bg-purple-100 p-3 rounded-full mb-1">
            <Ionicons name="train" size={20} color="#8B5CF6" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Train</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center mr-6">
          <View className="bg-yellow-100 p-3 rounded-full mb-1">
            <Ionicons name="bus" size={20} color="#F59E0B" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Bus</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center mr-6">
          <View className="bg-red-100 p-3 rounded-full mb-1">
            <Ionicons name="car" size={20} color="#EF4444" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Car Rental</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center mr-6">
          <View className="bg-pink-100 p-3 rounded-full mb-1">
            <Ionicons name="ticket" size={20} color="#EC4899" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Activities</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
