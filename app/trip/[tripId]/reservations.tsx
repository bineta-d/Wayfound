import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// 1. Import your Scanner file!
import ScannerScreen from "../../screens/ScannerScreen";

interface Props {
  tripId: string;
}

export default function ReservationsSection({ tripId }: Props) {
  // 2. These states remember which tab the user clicked
  const [selectedType, setSelectedType] = useState("Accommodation");
  const [selectedBucket, setSelectedBucket] = useState("accommodations");

  const selectTab = (bucketName: string, reservationType: string) => {
    setSelectedBucket(bucketName);
    setSelectedType(reservationType);
  };

  return (
    <View className="flex-1 bg-white py-2 px-3">
      
      {/* THE ICONS ROW */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-24">
        
        {/* ACCOMMODATION */}
        <TouchableOpacity 
          className={`items-center mr-6 p-2 rounded-xl ${selectedType === 'Accommodation' ? 'bg-gray-100' : ''}`}
          onPress={() => selectTab('accommodations', 'Accommodation')}
        >
          <View className="bg-blue-100 p-3 rounded-full mb-1">
            <Ionicons name="bed" size={20} color="#3B82F6" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Accommodation</Text>
        </TouchableOpacity>

        {/* FLIGHT */}
        <TouchableOpacity 
          className={`items-center mr-6 p-2 rounded-xl ${selectedType === 'Flight' ? 'bg-gray-100' : ''}`}
          onPress={() => selectTab('transport', 'Flight')}
        >
          <View className="bg-green-100 p-3 rounded-full mb-1">
            <Ionicons name="airplane" size={20} color="#10B981" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Flight</Text>
        </TouchableOpacity>

        {/* TRAIN */}
        <TouchableOpacity 
          className={`items-center mr-6 p-2 rounded-xl ${selectedType === 'Train' ? 'bg-gray-100' : ''}`}
          onPress={() => selectTab('transport', 'Train')}
        >
          <View className="bg-purple-100 p-3 rounded-full mb-1">
            <Ionicons name="train" size={20} color="#8B5CF6" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Train</Text>
        </TouchableOpacity>

        {/* BUS */}
        <TouchableOpacity 
          className={`items-center mr-6 p-2 rounded-xl ${selectedType === 'Bus' ? 'bg-gray-100' : ''}`}
          onPress={() => selectTab('transport', 'Bus')}
        >
          <View className="bg-yellow-100 p-3 rounded-full mb-1">
            <Ionicons name="bus" size={20} color="#F59E0B" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Bus</Text>
        </TouchableOpacity>

        {/* CAR RENTAL */}
        <TouchableOpacity 
          className={`items-center mr-6 p-2 rounded-xl ${selectedType === 'Car Rental' ? 'bg-gray-100' : ''}`}
          onPress={() => selectTab('transport', 'Car Rental')}
        >
          <View className="bg-red-100 p-3 rounded-full mb-1">
            <Ionicons name="car" size={20} color="#EF4444" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Car Rental</Text>
        </TouchableOpacity>

        {/* ACTIVITIES */}
        <TouchableOpacity 
          className={`items-center mr-6 p-2 rounded-xl ${selectedType === 'Activities' ? 'bg-gray-100' : ''}`}
          onPress={() => selectTab('activities', 'Activities')}
        >
          <View className="bg-pink-100 p-3 rounded-full mb-1">
            <Ionicons name="ticket" size={20} color="#EC4899" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Activities</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 3. THE EMBEDDED UPLOAD BOX! */}
      <View className="flex-1 mt-2">
        <ScannerScreen bucket={selectedBucket} type={selectedType}  tripId={tripId}/>
      </View>
      
    </View>
  );
}