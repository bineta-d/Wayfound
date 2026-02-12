import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

export default function SignupScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        dob: '',
        avatarUrl: '',
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Complete any pending auth session when component mounts
    WebBrowser.maybeCompleteAuthSession();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
            setFormData(prev => ({ ...prev, avatarUrl: result.assets[0].uri }));
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSignUp = async () => {
        console.log('🔍 Signup: Sign up attempt started');
        console.log('🔍 Signup: Email:', formData.email);
        console.log('🔍 Signup: Full Name:', formData.fullName);
        console.log('🔍 Signup: DOB:', formData.dob);

        if (!formData.fullName || !formData.email || !formData.password || !formData.dob) {
            console.log('🔍 Signup: Validation failed - missing fields');
            Alert.alert('Error', 'Please fill in all required fields (Full Name, Email, Password, Date of Birth)');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            console.log('🔍 Signup: Invalid email format');
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        // Validate DOB format (MM-DD-YYYY)
        const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
        if (!dobRegex.test(formData.dob)) {
            console.log('🔍 Signup: Invalid DOB format');
            Alert.alert('Error', 'Please enter date of birth in MM-DD-YYYY format');
            return;
        }

        // Transform DOB to YYYY-MM-DD for the backend
        const [month, day, year] = formData.dob.split('-');
        const formattedDob = `${year}-${month}-${day}`;

        // Validate password length
        if (formData.password.length < 6) {
            console.log('🔍 Signup: Password too short');
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        const userData = {
            full_name: formData.fullName,
            dob: formattedDob,
            avatar_url: formData.avatarUrl || null,
        };

        console.log('🔍 Signup: Calling signUp function...');
        const { error } = await signUp(formData.email, formData.password, userData);

        if (error) {
            console.log('🔍 Signup: Sign up error:', error.message);
            Alert.alert('Error', error.message);
        } else {
            console.log('🔍 Signup: Sign up successful');
            Alert.alert('Success', 'Account created successfully!');
            router.replace('/(tabs)/home');
        }

        setLoading(false);
    };

    const handleGoogleSignUp = async () => {
        console.log('🔍 Google SignUp: Starting Google OAuth sign up');
        setGoogleLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'https://lzhdfmvshtlxrdhlbrqh.supabase.co/auth/v1/callback',
                },
            });

            if (error) {
                console.log('🔍 Google SignUp: Error:', error.message);
                Alert.alert('Error', error.message);
            } else if (data?.url) {
                console.log('🔍 Google SignUp: OAuth flow initiated', data);

                // Open the OAuth URL in a web browser
                const result = await WebBrowser.openBrowserAsync(data.url);

                console.log('🔍 Google SignUp: Browser opened');
            } else {
                console.log('🔍 Google SignUp: No URL returned');
                Alert.alert('Error', 'Failed to initiate Google sign up');
            }
        } catch (error: any) {
            console.log('🔍 Google SignUp: Exception:', error);
            Alert.alert('Error', 'Failed to initiate Google sign up');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <Text className="text-2xl font-bold mb-8">Create Account</Text>

            <View className="w-full max-w-sm">
                <Text className="text-gray-700 text-base font-semibold mb-2">Full Name</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChangeText={(value) => handleInputChange('fullName', value)}
                    autoCapitalize="words"
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Email</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Date of Birth (MM-DD-YYYY)</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    placeholder="Date of Birth (MM-DD-YYYY)"
                    value={formData.dob}
                    onChangeText={(value) => handleInputChange('dob', value)}
                />

                <Text className="text-gray-700 text-base font-semibold mb-2">Profile Picture (Optional)</Text>
                <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-4 mb-4"
                    onPress={pickImage}
                >
                    <Text className="text-center text-gray-600">Profile Picture (Optional)</Text>
                    {selectedImage ? (
                        <Image
                            source={{ uri: selectedImage }}
                            className="w-20 h-20 rounded-full mx-auto mt-2"
                        />
                    ) : (
                        <Text className="text-center text-gray-400 mt-2">Tap to select image</Text>
                    )}
                </TouchableOpacity>

                <Text className="text-gray-700 text-base font-semibold mb-2">Password</Text>
                <TextInput
                    className="w-full border border-gray-300 rounded-lg p-4 mb-6"
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry
                />

                <TouchableOpacity
                    className="w-full bg-blue-500 rounded-lg p-4"
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    <Text className="text-white text-center font-semibold">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="mt-4"
                    onPress={() => router.push('/(auth)/login')}
                >
                    <Text className="text-blue-500">Already have an account? Sign In</Text>
                </TouchableOpacity>
            </View>

            <View className="mt-8 w-full max-w-sm">
                <View className="flex-row items-center justify-center mb-4">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="px-4 text-gray-500 text-sm">Or sign up with</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                </View>

                <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-4 flex-row items-center justify-center"
                    onPress={handleGoogleSignUp}
                    disabled={googleLoading}
                >
                    <Image
                        source={require('../../assets/google.png')}
                        className="w-5 h-5 mr-3"
                        resizeMode="contain"
                    />
                    <Text className="text-gray-700 font-semibold text-center">
                        {googleLoading ? 'Signing up with Google...' : 'Sign up with Google'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
