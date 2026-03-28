import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { user, loading } = useAuth();

    console.log('🔍 Index: Component rendering');
    console.log('🔍 Index: Loading state:', loading);
    console.log('🔍 Index: User authenticated:', !!user);
    console.log('🔍 Index: User email:', user?.email || 'None');

    if (loading) {
        console.log('🔍 Index: Showing loading screen');
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user) {
        console.log('🔍 Index: No user found, redirecting to login');
        return <Redirect href="/(auth)/login" />;
    }

    console.log('🔍 Index: User authenticated, redirecting to home');
    return <Redirect href="/(tabs)/home" />;
}
