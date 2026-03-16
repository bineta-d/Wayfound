import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

// This creates the "Props" (the settings) for our pop-up box
interface InviteModalProps {
  isVisible: boolean;
  onClose: () => void;
  tripId: string; // We need to know WHICH trip to invite them to!
}

export default function InviteModal({ isVisible, onClose, tripId }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // This is the function that runs when they click the "Send Invite" button
  const handleInvite = async () => {
    // Make sure they actually typed a real email with an @ symbol
    if (!email.includes('@')) {
      Alert.alert("Hold up!", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // 1. Save the friend's email to the trip in the Supabase Database
      const { error } = await supabase
        .from('collaborators') 
        .insert([{ 
          trip_id: tripId, 
          user_email: email, 
          role: 'member' 
        }]);

      if (error) {
         console.log(error);
         throw new Error("Could not add them to the database.");
      }

      // 2. Show a success message and close the pop-up!
      Alert.alert("Success! 🎉", `An invite has been sent to ${email}`);
      setEmail(''); // Clear out the text box
      onClose(); // Close the pop-up box

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // The Modal is the actual pop-up layer that sits on top of the screen
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      {/* This View makes the dark, see-through background behind the pop-up */}
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        
        {/* This View is the actual white pop-up box */}
        <View className="bg-white w-full rounded-2xl p-6 shadow-lg">
          
          {/* Header Row: Title and Close 'X' Button */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Invite a Friend</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 mb-4">
            Enter their email below to add them to this trip's collaborators.
          </Text>

          {/* The Text Input Box */}
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="friend@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* The Submit Button */}
          <TouchableOpacity 
            onPress={handleInvite}
            disabled={loading}
            className={`py-3 rounded-xl items-center justify-center flex-row ${loading ? 'bg-blue-300' : 'bg-blue-500'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : (
              <Ionicons name="send" size={18} color="white" className="mr-2" />
            )}
            <Text className="text-white font-bold text-lg ml-2">
              {loading ? "Sending..." : "Send Invite"}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}