import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <Text className="text-2xl font-bold mb-8">Create Account</Text>

            <View className="w-full max-w-sm">
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Full Name"
                    autoCapitalize="words"
                />

                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-6"
                    placeholder="Password"
                    secureTextEntry
                />

                <TouchableOpacity
                    className="w-full bg-blue-500 rounded-lg p-4"
                    onPress={() => router.replace('/(tabs)/home')}
                >
                    <Text className="text-white text-center font-semibold">Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="mt-4"
                    onPress={() => router.push('/login')}
                >
                    <Text className="text-blue-500">Already have an account? Sign In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
