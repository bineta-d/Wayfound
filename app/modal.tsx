import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold">Modal</Text>
      <View className="h-px w-4/5 bg-gray-300 my-8" />
      <Text className="text-gray-600">Modal content here</Text>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
