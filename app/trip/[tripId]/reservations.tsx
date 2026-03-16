import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // <-- Added router import
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ReservationsSection() {
  const router = useRouter(); // <-- Initialized router

  // Helper function: Opens scanner and passes the correct bucket name
  const openScanner = (bucketName: string, reservationType: string) => {
    router.push({
      pathname: "/screens/ScannerScreen",
      params: { bucket: bucketName, type: reservationType }
    });
  };

  return (
    <View className="flex-1 bg-white py-2 px-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {/* ACCOMMODATION -> accommodations bucket */}
        <TouchableOpacity 
          className="items-center mr-6"
          onPress={() => openScanner('accommodations', 'Accommodation')}
        >
          <View className="bg-blue-100 p-3 rounded-full mb-1">
            <Ionicons name="bed" size={20} color="#3B82F6" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">
            Accommodation
          </Text>
        </TouchableOpacity>

        {/* FLIGHT -> transport bucket */}
        <TouchableOpacity 
          className="items-center mr-6"
          onPress={() => openScanner('transport', 'Flight')}
        >
          <View className="bg-green-100 p-3 rounded-full mb-1">
            <Ionicons name="airplane" size={20} color="#10B981" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Flight</Text>
        </TouchableOpacity>

        {/* TRAIN -> transport bucket */}
        <TouchableOpacity 
          className="items-center mr-6"
          onPress={() => openScanner('transport', 'Train')}
        >
          <View className="bg-purple-100 p-3 rounded-full mb-1">
            <Ionicons name="train" size={20} color="#8B5CF6" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Train</Text>
        </TouchableOpacity>

        {/* BUS -> transport bucket */}
        <TouchableOpacity 
          className="items-center mr-6"
          onPress={() => openScanner('transport', 'Bus')}
        >
          <View className="bg-yellow-100 p-3 rounded-full mb-1">
            <Ionicons name="bus" size={20} color="#F59E0B" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Bus</Text>
        </TouchableOpacity>

        {/* CAR RENTAL -> transport bucket */}
        <TouchableOpacity 
          className="items-center mr-6"
          onPress={() => openScanner('transport', 'Car Rental')}
        >
          <View className="bg-red-100 p-3 rounded-full mb-1">
            <Ionicons name="car" size={20} color="#EF4444" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Car Rental</Text>
        </TouchableOpacity>

        {/* ACTIVITIES -> activities bucket */}
        <TouchableOpacity 
          className="items-center mr-6"
          onPress={() => openScanner('activities', 'Activities')}
        >
          <View className="bg-pink-100 p-3 rounded-full mb-1">
            <Ionicons name="ticket" size={20} color="#EC4899" />
          </View>
          <Text className="text-xs text-neutral-textSecondary">Activities</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}