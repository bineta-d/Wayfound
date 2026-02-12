import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Button, Image, SafeAreaView, ScrollView, Text, View } from 'react-native';

// Import database key
import { supabase } from '../../lib/supabase';
// Import text translator
import { decode } from 'base64-arraybuffer';

export default function ScannerScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('Awaiting image...');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true, // <-- NEW: Tells the phone to give us the raw text data of the image
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64Data = result.assets[0].base64; // <-- Grab that raw data
      
      setImageUri(uri);
      setStatusText('Preparing to upload to cloud...');
      
      // Send the raw data to Supabase
      if (base64Data) {
        uploadToSupabase(base64Data);
      } else {
        setStatusText('Error: Could not read image data.');
      }
    }
  };

  const uploadToSupabase = async (base64Data: string) => {
    try {
      setStatusText('Uploading to Supabase...');
      
      const fileName = `screenshot_${Date.now()}.jpg`;

      // Use our new 'decode' tool to translate the data into a real file
      const { data, error } = await supabase.storage
        .from('trip-uploads')
        .upload(fileName, decode(base64Data), {
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error("Supabase Error:", error);
        setStatusText('Upload failed! Check terminal.');
      } else {
        setStatusText('✅ Successfully uploaded to cloud!');
        Alert.alert("Success!", "File sent to Supabase!");
      }

    } catch (error) {
      console.error("Upload Error:", error);
      setStatusText('Upload failed! Check terminal.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-12 items-center">
      <Text className="text-2xl font-bold mb-6 text-center">
        Upload Flight Confirmation
      </Text>

      {imageUri ? (
        <Image 
          source={{ uri: imageUri }} 
          className="w-full h-64 rounded-xl mb-4" 
          resizeMode="contain" 
        />
      ) : (
        <View className="w-full h-64 bg-gray-100 rounded-xl mb-4 items-center justify-center border-2 border-dashed border-gray-300">
           <Text className="text-gray-500">No image selected</Text>
        </View>
      )}

      <Button 
        title="Select Screenshot" 
        onPress={pickImage} 
      />

      <View className="flex-1 w-full mt-6 mb-8">
        <Text className="font-bold text-gray-700 mb-2">Cloud Status:</Text>
        <ScrollView className="bg-gray-100 p-4 rounded-xl border border-gray-200">
          <Text className="text-sm text-gray-800">
            {statusText}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}