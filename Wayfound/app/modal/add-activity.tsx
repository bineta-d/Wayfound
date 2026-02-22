import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddActivityModal() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white p-6">
            <Text className="text-2xl font-bold mb-6">Add Activity</Text>

            <View className="space-y-4">
                <TextInput
                    className="border border-gray-300 rounded-lg p-4"
                    placeholder="Activity Name"
                />

                <TextInput
                    className="border border-gray-300 rounded-lg p-4"
                    placeholder="Location"
                />

                <TextInput
                    className="border border-gray-300 rounded-lg p-4 h-24"
                    placeholder="Description"
                    multiline
                />

                <TextInput
                    className="border border-gray-300 rounded-lg p-4"
                    placeholder="Time"
                />
            </View>

            <View className="flex-row justify-end space-x-4 mt-6">
                <TouchableOpacity
                    className="bg-gray-300 rounded-lg p-4"
                    onPress={() => router.back()}
                >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-blue-500 rounded-lg p-4"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
