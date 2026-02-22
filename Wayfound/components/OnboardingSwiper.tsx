import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

interface OnboardingSwiperProps {
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export default function OnboardingSwiper({ userId, email, fullName = '', avatarUrl = '' }: OnboardingSwiperProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(avatarUrl || null);
  
  const [formData, setFormData] = useState({
    fullName: fullName || '',
    dob: '',
    avatarUrl: avatarUrl || '',
  });

  const steps = [
    { title: 'Welcome!', subtitle: 'Let\'s complete your profile' },
    { title: 'Full Name', subtitle: 'What should we call you?' },
    { title: 'Date of Birth', subtitle: 'When were you born?' },
    { title: 'Profile Picture', subtitle: 'Add a photo (optional)' },
    { title: 'All Set!', subtitle: 'Your profile is complete' }
  ];

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

  const validateStep = () => {
    switch (currentStep) {
      case 1: // Full Name
        if (!formData.fullName.trim()) {
          Alert.alert('Error', 'Please enter your full name');
          return false;
        }
        return true;
      case 2: // Date of Birth
        if (!formData.dob.trim()) {
          Alert.alert('Error', 'Please enter your date of birth');
          return false;
        }
        // Validate DOB format (MM-DD-YYYY)
        const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
        if (!dobRegex.test(formData.dob)) {
          Alert.alert('Error', 'Please enter date of birth in MM-DD-YYYY format');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Transform DOB to YYYY-MM-DD for the backend
      const [month, day, year] = formData.dob.split('-');
      const formattedDob = `${year}-${month}-${day}`;

      // Upload profile picture if provided and it's a local file
      let finalAvatarUrl = formData.avatarUrl;
      if (formData.avatarUrl && formData.avatarUrl.startsWith('file://')) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(`${userId}/profile.png`, {
            uri: formData.avatarUrl,
            type: 'image',
            name: 'profile.png',
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(`${userId}/profile.png`);
          finalAvatarUrl = publicUrl;
        }
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          dob: formattedDob,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', userId);

      if (error) {
        console.log('Onboarding: Profile update failed:', error.message);
        Alert.alert('Error', 'Failed to update profile');
      } else {
        console.log('Onboarding: Profile completed successfully');
        Alert.alert('Success', 'Profile completed successfully!');
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.log('Onboarding: Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <View className="flex-1 items-center justify-center">
            <Text className="text-3xl font-bold text-center mb-4">🎉</Text>
            <Text className="text-xl font-semibold text-center mb-2">Welcome to Wayfound!</Text>
            <Text className="text-gray-600 text-center">Let's complete your profile to get you started.</Text>
          </View>
        );

      case 1: // Full Name
        return (
          <View className="flex-1 justify-center">
            <Text className="text-2xl font-bold mb-6">What's your full name?</Text>
            <TextInput
              className="w-full border border-gray-300 rounded-lg p-4 text-lg"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              autoCapitalize="words"
            />
          </View>
        );

      case 2: // Date of Birth
        return (
          <View className="flex-1 justify-center">
            <Text className="text-2xl font-bold mb-6">When were you born?</Text>
            <TextInput
              className="w-full border border-gray-300 rounded-lg p-4 text-lg"
              placeholder="MM-DD-YYYY"
              value={formData.dob}
              onChangeText={(value) => handleInputChange('dob', value)}
              keyboardType="numeric"
              maxLength={10}
            />
            <Text className="text-gray-500 text-sm mt-2">Format: MM-DD-YYYY</Text>
          </View>
        );

      case 3: // Profile Picture
        return (
          <View className="flex-1 justify-center">
            <Text className="text-2xl font-bold mb-6 text-center">Add a profile picture</Text>
            <Text className="text-gray-600 text-center mb-8">This step is optional</Text>
            
            <TouchableOpacity
              className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 items-center justify-center mx-auto mb-6"
              onPress={pickImage}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <View className="items-center">
                  <Text className="text-3xl mb-2">📷</Text>
                  <Text className="text-gray-500 text-sm text-center">Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {selectedImage && (
              <TouchableOpacity
                className="mx-auto"
                onPress={pickImage}
              >
                <Text className="text-blue-500">Change photo</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 4: // Complete
        return (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-6">✅</Text>
            <Text className="text-2xl font-bold text-center mb-2">All Set!</Text>
            <Text className="text-gray-600 text-center">Your profile is complete. Let's start your journey!</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      {/* Progress Indicator */}
      <View className="flex-row justify-center mb-8">
        {steps.map((_, index) => (
          <View
            key={index}
            className={`h-2 flex-1 mx-1 rounded-full ${
              index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </View>

      {/* Step Title */}
      <View className="mb-8">
        <Text className="text-2xl font-bold text-center">{steps[currentStep].title}</Text>
        <Text className="text-gray-600 text-center mt-1">{steps[currentStep].subtitle}</Text>
      </View>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <View className="mt-auto">
        {currentStep > 0 && (
          <TouchableOpacity
            className="mb-3 border border-gray-300 rounded-lg p-4"
            onPress={handlePrevious}
            disabled={loading}
          >
            <Text className="text-gray-700 text-center font-semibold">Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-blue-500 rounded-lg p-4"
          onPress={handleNext}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold">
            {loading ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>

        {currentStep === 0 && (
          <TouchableOpacity
            className="mt-3"
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text className="text-gray-500 text-center">Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
