import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        console.log('🔍 Login: Sign in attempt started');
        console.log('🔍 Login: Email:', email);

        if (!email || !password) {
            console.log('🔍 Login: Validation failed - missing fields');
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        console.log('🔍 Login: Calling signIn function...');
        const { error } = await signIn(email, password);

        if (error) {
            console.log('🔍 Login: Sign in error:', error.message);
            Alert.alert('Error', error.message);
        } else {
            console.log('🔍 Login: Sign in successful, navigating to home');
            router.replace('/(tabs)/home');
        }

        setLoading(false);
    };

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <Text className="text-2xl font-bold mb-8">Welcome Back</Text>

            <View className="w-full max-w-sm">
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-6"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    className="w-full bg-blue-500 rounded-lg p-4"
                    onPress={handleSignIn}
                    disabled={loading}
                >
                    <Text className="text-white text-center font-semibold">
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="mt-4"
                    onPress={() => router.push('/(auth)/signup')}
                >
                    <Text className="text-blue-500">Don't have an account? Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
