import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';


export default function AIPlannerScreen() {
  const params = useLocalSearchParams();

  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState("");

  const toggleInterest = (value: string) => {
    if (interests.includes(value)) {
      setInterests(interests.filter(i => i !== value));
    } else {
      setInterests([...interests, value]);
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
      enableOnAndroid={true}
      extraScrollHeight={120}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

    <Text className="text-3xl font-bold mb-2">
      🤖 AI Trip Planner
    </Text>

    <Text className="text-base mb-1">
      Destination: {params.destination}
    </Text>

    <Text className="text-base mb-6">
      Dates: {params.startDate} → {params.endDate}
    </Text>


    {/* Prompt */}
    <Text className="font-semibold mb-2">Describe your trip</Text>

    <TextInput
      placeholder="I want food spots, hidden gems, rooftop bars..."
      value={prompt}
      onChangeText={setPrompt}
      multiline
       className="border border-gray-300 rounded-xl p-4 h-28 mb-6"
     />


    {/* Budget */}
    <Text className="font-semibold mb-2">Budget ($)</Text>

    <TextInput
      placeholder="Enter total budget in USD"
      value={budget}
      onChangeText={setBudget}
      keyboardType="numeric"
      className="border border-gray-300 rounded-xl p-4 mb-6"
    />


    {/* Interests */}
    <Text className="font-semibold mb-2 text-gray-800">
      Interests
    </Text>

    <View className="flex-row flex-wrap mb-6">
      {["food","culture","nature","nightlife","shopping","relax"].map(i => {
        const selected = interests.includes(i);

        return (
          <TouchableOpacity
            key={i}
            onPress={() => toggleInterest(i)}
            className={`
              px-4 py-2 mr-2 mb-2 rounded-full
              ${selected ? "bg-emerald-500" : "bg-gray-200"}
            `}
          >

            <Text
               className={`
                text-sm font-medium
                ${selected ? "text-white" : "text-black"}
              `}
              numberOfLines={1}
            >
               {i}
             </Text>
          </TouchableOpacity>
        );
      })}
    </View>


    {/* Other interests */}
    <Text className="font-semibold mb-2">Other interests</Text>

    <TextInput
      placeholder="anime, photography, rooftop bars..."
      value={customInterests}
      onChangeText={setCustomInterests}
      className="border border-gray-300 rounded-xl p-4 mb-8"
    />


    {/* Generate button */}
    <TouchableOpacity
      className="bg-black py-4 rounded-xl items-center justify-center w-full"
      onPress={()=>{
        const extra = customInterests
          .split(",")
          .map(i=>i.trim())
          .filter(i=>i.length>0);

        const finalInterests = [...interests, ...extra];

        console.log({
          destination: params.destination,
          startDate: params.startDate,
          endDate: params.endDate,
          budget,
          prompt,
          interests: finalInterests
        });
      }}
    >

      <Text className="text-white font-bold text-lg text-center w-full">
        ✨ Generate Itinerary
      </Text>
    </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}
