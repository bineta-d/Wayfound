import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { router } from "expo-router";

// Temporary mock data
const notifications = [
  {
    id: "1",
    title: "Trip invite",
    body: "You were invited to join the Paris France trip.",
    tripId: "92e04d25-9a6b-4386-9ffc-641cf7eec790",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "New itinerary",
    body: "A new itinerary was created for your Rome Italy trip.",
    tripId: "7780b4ba-aaa2-45d3-954a-0963e018d53f",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "New comment",
    body: "Someone commented on your Lisbon Portugal trip.",
    tripId: "72219d3b-2965-45ca-a3d6-364a4177933a",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "New poll",
    body: "A new poll was added to your Prague Czech Republic trip.",
    tripId: "1f38b010-5f46-4f89-b9d7-0708e7f87ac7",
    createdAt: new Date().toISOString(),
  },
];

export default function NotificationsScreen() {

  const handlePress = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  return (
    <View className="flex-1 bg-background px-5 pt-16">
      <Text className="text-xl font-semibold mb-4">Notifications</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const date = new Date(item.createdAt);
          const formatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

          return (
            <TouchableOpacity
              className="bg-white px-4 py-4 rounded-xl mb-4"
              style={{
                marginHorizontal: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => handlePress(item.tripId)}
              activeOpacity={0.85}
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="font-semibold text-[17px] text-textPrimary flex-1 pr-3">
                  {item.title}
                </Text>
                <Text className="text-[11px] text-textSecondary">
                  {formatted}
                </Text>
              </View>

              <Text className="text-[15px] leading-6 text-textSecondary">
                {item.body}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text className="text-center text-secondary mt-10">
            No notifications yet
          </Text>
        }
      />
    </View>
  );
}
