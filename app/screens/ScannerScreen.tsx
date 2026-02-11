import { extractTextFromImage } from '@zhanziyang/expo-text-extractor';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Button, Image, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function ScannerScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('Awaiting image...');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      
      // -- THE AI MAGIC HAPPENS HERE --
      try {
        setExtractedText('Scanning...');
        // This tells the native phone processor to read the image
        const texts = await extractTextFromImage(uri);
        // The texts come back as an array of lines, so we join them with a line break
        setExtractedText(texts.join('\n'));
      } catch (error) {
        console.error(error);
        setExtractedText('Failed to read text. (See terminal for error)');
      }
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

      {/* This new box will show what the AI reads! */}
      <View className="flex-1 w-full mt-6 mb-8">
        <Text className="font-bold text-gray-700 mb-2">Extracted Text:</Text>
        <ScrollView className="bg-gray-100 p-4 rounded-xl border border-gray-200">
          <Text className="text-sm text-gray-800">
            {extractedText}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}