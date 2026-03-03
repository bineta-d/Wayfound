import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TabsSectionProps {
  activeTab: number;
  setActiveTab: (index: number) => void;
}
export default function TabsSection({
  activeTab,
  setActiveTab,
}: TabsSectionProps) {
  return (
    <View className="flex-row bg-white px-6 pt-4 pb-2 border-b border-gray-200">
      {["Overview", "Itinerary", "Reservations", "Budget"].map((tab, idx) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(idx)}
          style={{ flex: 1 }}
        >
          <Text
            className={`text-center font-semibold pb-2 ${activeTab === idx ? "text-[#D81E5B] border-b-2 border-[#D81E5B]" : "text-gray-500"}`}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
