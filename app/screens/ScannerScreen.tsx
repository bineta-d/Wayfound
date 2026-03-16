import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// IMPORTS
import { decode } from 'base64-arraybuffer';
import PrimaryButton from '../../components/PrimaryButton';
import { supabase } from '../../lib/supabase';

export default function ScannerScreen() {
  const router = useRouter();
  
  // 🎯 MAGIC HOOK: This catches the exact bucket and type sent from the Reservations UI!
  const { bucket, type } = useLocalSearchParams(); 

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>(`Ready to scan ${type || 'document'}`);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64Data = result.assets[0].base64;
      setImageUri(uri);
      
      if (base64Data) {
        handleImageProcessing(uri, base64Data);
      }
    }
  };

  const handleImageProcessing = async (uri: string, base64Data: string) => {
    setLoading(true);
    setStatusText('Analyzing...');
    setExtractedText(''); // Clear previous results

    // 1. Upload to the SPECIFIC bucket the user clicked
    const targetBucket = (bucket as string) || 'trip-uploads';
    uploadToSupabase(base64Data, targetBucket);

    // 2. Analyze with Google
    await analyzeWithGoogleVision(base64Data);
    
    setLoading(false);
  };

  const uploadToSupabase = async (base64Data: string, targetBucket: string) => {
    try {
      const fileName = `scan_${Date.now()}.jpg`;
      await supabase.storage
        .from(targetBucket) // Uses the dynamic bucket!
        .upload(fileName, decode(base64Data), { contentType: 'image/jpeg' });
      console.log(`✅ Uploaded to bucket: ${targetBucket}`);
    } catch (error) {
      console.error("Upload Error:", error);
    }
  };

  const analyzeWithGoogleVision = async (base64Data: string) => {
    try {
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      const apiURL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
      const requestBody = {
        requests: [{ image: { content: base64Data }, features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }]
      };

      const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.responses && data.responses[0].fullTextAnnotation) {
        setExtractedText(data.responses[0].fullTextAnnotation.text);
        setStatusText('Analysis Complete');
      } else {
        setExtractedText('Could not read text from this image.');
        setStatusText('Analysis Failed');
      }
    } catch (error) {
      console.error("Google Vision Error:", error);
      setStatusText('Error connecting to AI');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white rounded-full shadow-sm">
           <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Scan {type}</Text>
        <View className="w-10" /> 
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        
        {/* IMAGE PREVIEW CARD */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-6 items-center justify-center min-h-[250px] border border-gray-100">
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              className="w-full h-64 rounded-xl" 
              resizeMode="contain" 
            />
          ) : (
            <View className="items-center justify-center py-10">
               <View className="bg-blue-50 p-6 rounded-full mb-4">
                 <Ionicons name="image-outline" size={40} color="#3B82F6" />
               </View>
               <Text className="text-gray-400 text-center">Select a screenshot of your{"\n"}{type} confirmation</Text>
            </View>
          )}
          
          {loading && (
            <View className="absolute inset-0 bg-white/80 items-center justify-center rounded-2xl">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-blue-600 font-bold mt-2">Reading Ticket...</Text>
            </View>
          )}
        </View>

        {/* RESULTS AREA */}
        {extractedText ? (
          <View className="bg-white rounded-2xl shadow-sm p-5 mb-20 border border-gray-100">
            <View className="flex-row items-center mb-4 border-b border-gray-100 pb-3">
              <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
              <Text className="text-gray-800 font-bold ml-2 text-lg">Extracted Details</Text>
            </View>
            <Text className="text-gray-600 leading-6 font-mono text-sm">
              {extractedText}
            </Text>
          </View>
        ) : null}

      </ScrollView>

      {/* FOOTER ACTION BUTTON */}
      <View className="absolute bottom-10 left-6 right-6">
        <PrimaryButton 
          title={imageUri ? "Scan Another Image" : "Select Image"}
          onPress={pickImage}
        />
      </View>
    </SafeAreaView>
  );
}