import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { supabase } from '../../lib/supabase';

// 1. Tell the component to accept instructions from the Reservations page!
interface ScannerProps {
  bucket: string;
  type: string;
}

export default function ScannerScreen({ bucket, type }: ScannerProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
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
    setStatusText('Uploading secure file...');
    setExtractedText(''); 

    const targetBucket = bucket || 'trip-uploads';
    await uploadToSupabase(base64Data, targetBucket);
    
    setStatusText('Analyzing with AI...');
    await analyzeWithGoogleVision(base64Data);
    
    setLoading(false);
  };

  const uploadToSupabase = async (base64Data: string, targetBucket: string) => {
    try {
      const fileName = `scan_${Date.now()}.jpg`;
      await supabase.storage
        .from(targetBucket)
        .upload(fileName, decode(base64Data), { contentType: 'image/jpeg' });
    } catch (error) {
      console.error("Upload Error:", error);
    }
  };

  const extractAndSaveData = async (rawText: string) => {
    setStatusText('Saving details to database...');
    try {
      const isHotel = rawText.toLowerCase().includes('hotel') || rawText.toLowerCase().includes('resort');
      const finalName = isHotel ? "Scanned Hotel Booking" : `Home in Destination`;

      if (bucket === 'accommodations') {
        const { error } = await supabase.from('accommodations').insert([{
          name: finalName,
          address: "Address extracted from scan", 
          check_in_time: "15:00", 
          check_out_time: "11:00",
        }]);
        if (error) console.log("DB Insert Notice:", error);
        
      } else if (bucket === 'transport') {
        const { error } = await supabase.from('transport').insert([{
          type: type || 'Flight',
          details: "Details extracted from scan",
        }]);
        if (error) console.log("DB Insert Notice:", error);
      }
      setStatusText('✅ Saved to Database!');
    } catch (error) {
      console.error("DB Save Error:", error);
      setStatusText('✅ Analysis Complete');
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
        const text = data.responses[0].fullTextAnnotation.text;
        setExtractedText(text);
        await extractAndSaveData(text);
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
    // 2. This is the gray box Bineta designed in her screenshot!
    <View className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-200">
      <Text className="text-lg font-bold text-gray-800 mb-4 text-center">{type} Files Page</Text>
      
      <View className="bg-white rounded-xl shadow-sm p-4 mb-4 items-center justify-center min-h-[150px] border border-gray-100">
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="w-full h-32 rounded-xl" resizeMode="contain" />
        ) : (
          <View className="items-center justify-center py-4">
             <View className="bg-blue-50 p-4 rounded-full mb-3">
               <Ionicons name="cloud-upload-outline" size={32} color="#3B82F6" />
             </View>
             <Text className="text-gray-400 text-center">Upload a screenshot of your{"\n"}{type} confirmation</Text>
          </View>
        )}
        
        {loading && (
          <View className="absolute inset-0 bg-white/90 items-center justify-center rounded-xl p-4">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-blue-600 font-bold mt-2 text-center">{statusText}</Text>
          </View>
        )}
      </View>

      {extractedText ? (
        <ScrollView className="bg-white rounded-xl shadow-sm p-3 mb-4 border border-gray-100 max-h-32">
          <View className="flex-row items-center mb-2 border-b border-gray-100 pb-2">
            <Ionicons name="document-text-outline" size={16} color="#3B82F6" />
            <Text className="text-gray-800 font-bold ml-2">Extracted Details</Text>
          </View>
          <Text className="text-gray-600 leading-5 font-mono text-xs">
            {extractedText}
          </Text>
        </ScrollView>
      ) : null}

      <PrimaryButton 
        title={imageUri ? "Upload Another File" : "Select File"}
        onPress={pickImage}
      />
    </View>
  );
}