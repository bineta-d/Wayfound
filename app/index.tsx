import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, Text } from 'react-native';

export default function Index() {
    const { user, loading } = useAuth();

    console.log('🔍 Index: Loading:', loading);
    console.log('🔍 Index: User authenticated:', !!user);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user) {
        console.log('🔍 Index: No user, redirecting to login');
        return <Redirect href="/(auth)/login" />;
    }

    console.log('🔍 Index: User authenticated, redirecting to home');
    return <Redirect href="/(tabs)/home" />;
}
