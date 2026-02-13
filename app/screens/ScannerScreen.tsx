import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Button, Image, SafeAreaView, ScrollView, Text, View } from 'react-native';

// 1. Import your database key
import { supabase } from '../../lib/supabase';
// 2. Import our text translator
import { decode } from 'base64-arraybuffer';

export default function ScannerScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('Awaiting image...');
  const [extractedText, setExtractedText] = useState<string>(''); // New state for the result!
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true, // We still need this for both Google AND Supabase!
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64Data = result.assets[0].base64;
      
      setImageUri(uri);
      
      if (base64Data) {
        // KICK OFF BOTH TASKS AT ONCE!
        handleImageProcessing(uri, base64Data);
      }
    }
  };

  const handleImageProcessing = async (uri: string, base64Data: string) => {
    setLoading(true);
    setStatusText('Processing...');
    
    // Task A: Upload to Cloud (Keep this exactly as is)
    uploadToSupabase(base64Data);

    // Task B: Send to Google AI (The new part!)
    await analyzeWithGoogleVision(base64Data);
    
    setLoading(false);
  };

  // --- TASK A: STORAGE ---
  const uploadToSupabase = async (base64Data: string) => {
    try {
      const fileName = `screenshot_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('trip-uploads')
        .upload(fileName, decode(base64Data), { contentType: 'image/jpeg' });

      if (error) {
        console.error("Supabase Error:", error);
        setStatusText(prev => prev + '\n❌ Upload Failed');
      } else {
        setStatusText(prev => prev + '\n✅ Saved to Cloud Storage');
      }
    } catch (error) {
      setStatusText(prev => prev + '\n❌ Upload Error');
    }
  };

  // --- TASK B: GOOGLE VISION AI ---
  // --- TASK B: GOOGLE VISION AI (DEBUG VERSION) ---
  const analyzeWithGoogleVision = async (base64Data: string) => {
    try {
      // 1. Get the API Key
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      const apiURL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

      // 2. Prepare the package
      const requestBody = {
        requests: [
          {
            image: { content: base64Data },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }
        ]
      };

      // 3. Send it!
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      // 4. Check for specific errors
      if (data.error) {
        setExtractedText(`⚠️ Google Error: ${data.error.message}`);
        return;
      }

      // 5. Read the result
      if (data.responses && data.responses[0].fullTextAnnotation) {
        const text = data.responses[0].fullTextAnnotation.text;
        setExtractedText(text);
        setStatusText(prev => prev + '\n✅ Text Extracted by Google!');
      } else {
        // If no text, show us the raw data so we know why!
        setExtractedText(`No text found. Raw Response:\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error("Google Vision Error:", error);
      setStatusText(prev => prev + '\n❌ AI Analysis Failed');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-12 items-center">
      <Text className="text-2xl font-bold mb-6 text-center">
        Upload & Scan
      </Text>

      {imageUri ? (
        <Image 
          source={{ uri: imageUri }} 
          className="w-full h-48 rounded-xl mb-4" 
          resizeMode="contain" 
        />
      ) : (
        <View className="w-full h-48 bg-gray-100 rounded-xl mb-4 items-center justify-center border-2 border-dashed border-gray-300">
           <Text className="text-gray-500">No image selected</Text>
        </View>
      )}

      <Button title="Select Screenshot" onPress={pickImage} disabled={loading} />

      {loading && <ActivityIndicator size="large" color="#0000ff" className="mt-4" />}

      {/* RESULTS AREA */}
      <View className="flex-1 w-full mt-6 mb-8">
        <Text className="font-bold text-gray-700 mb-2">Status Log:</Text>
        <View className="bg-gray-100 p-2 rounded-lg mb-4 border border-gray-200">
          <Text className="text-xs text-gray-600">{statusText}</Text>
        </View>

        <Text className="font-bold text-gray-700 mb-2">Extracted Data:</Text>
        <ScrollView className="bg-white p-4 rounded-xl border border-gray-300 flex-1">
          <Text className="text-base text-gray-900">
            {extractedText || "Scan an image to see text here..."}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}