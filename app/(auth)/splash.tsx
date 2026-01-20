import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/(tabs)/home');
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-blue-500">
            <Text className="text-white text-2xl font-bold">Wayfound</Text>
            <Text className="text-blue-100 mt-2">Your AI Travel Companion</Text>
        </View>
    );
}
