import { generateTripPlan } from "@/lib/ai";
import { parseAIItinerary } from "@/lib/aiParser";
import { enrichActivities } from "@/lib/enrichActivities";
import { saveItinerary } from "@/lib/itineraryService";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';



export default function AIPlannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loadingAI, setLoadingAI] = useState(false);


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
    <View className="flex-1">

      <KeyboardAwareScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View className="flex-row items-center mb-4">
          <MaterialIcons name="auto-awesome" size={26} color="black" />
          <Text className="text-2xl font-bold ml-2">
            Create Itinerary
          </Text>
        </View>

        <Text className="text-lg text-gray-500">Destination</Text>
        <Text className="text-2xl font-bold mb-4">
          {params.destination}
        </Text>

        <Text className="text-lg text-gray-500">Dates</Text>
        <Text className="text-xl font-bold mb-6">
          {params.startDate} → {params.endDate}
        </Text>

        {/* Prompt */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="document-text-outline" size={18} color="black" />
          <Text className="font-semibold ml-2">Preferences</Text>
        </View>

        <TextInput
          placeholder="I want food spots, hidden gems, rooftop bars..."
          value={prompt}
          onChangeText={setPrompt}
          multiline
          className="border border-gray-300 rounded-xl p-4 h-28 mb-6"
        />

        {/* Budget */}
        <View className="flex-row items-center mb-2">
          <MaterialIcons name="attach-money" size={20} color="black" />
          <Text className="font-semibold ml-1">Budget</Text>
        </View>

        <View className="flex-row mb-6">
          <TextInput
            placeholder="Enter total budget"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            className="border border-gray-300 rounded-xl p-4 flex-1"
          />

          {/* placeholder currency (temporal) */}
          <View className="ml-2 px-4 justify-center border border-gray-300 rounded-xl bg-gray-100">
            <Text className="font-semibold">USD</Text>
          </View>
        </View>

        {/* Interests */}
        <Text className="font-semibold mb-2 text-gray-800">Interests</Text>

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
          onPress={async ()=>{ 
            try {
              setLoadingAI(true);

              const extra = customInterests
                .split(",")
                .map(i => i.trim())
                .filter(i => i.length > 0);

              const finalInterests = [...interests, ...extra];

              const result = await generateTripPlan({
                destination: params.destination as string,
                startDate: params.startDate as string,
                endDate: params.endDate as string,
                budget: Number(budget),
                interests: finalInterests,
                prompt: prompt
              });

              //  Step 1 — parse raw itinerary
              const parsed = parseAIItinerary(result.itinerary);
              console.log("🧠 PARSED ACTIVITIES:", parsed);

              //  Step 2 — enrich with Google Places
              const enriched = await enrichActivities(
                parsed,
                params.destination as string
              );

              // 💾 STEP 3 — SAVE TO DATABASE
              await saveItinerary(
                params.tripId as string,
                params.startDate as string,
                enriched
              );

              console.log("💾 Itinerary saved to DB");

              setTimeout(() => {
                router.replace(
                  (
                    `/trip/${params.tripId}` +
                    `?destination=${encodeURIComponent(params.destination as string)}` +
                    `&startDate=${params.startDate}` +
                    `&endDate=${params.endDate}` +
                    `&ai=${encodeURIComponent(JSON.stringify(result.itinerary))}`
                  ) as any
                );
              }, 700);

            } catch (err) {
              console.log("AI ERROR:", err);
              alert("Failed to generate itinerary");
              setLoadingAI(false);
            }
          }}
        >
          <View className="flex-row items-center">
            <MaterialIcons name="auto-awesome" size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Generate
            </Text>
          </View>
        </TouchableOpacity>

      </KeyboardAwareScrollView>

      {loadingAI && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/40 items-center justify-center">
        
          <View className="bg-white px-8 py-8 rounded-2xl items-center shadow-lg">
          
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="auto-awesome" size={22} color="black" />
              <Text className="text-xl font-bold ml-2">
                Generating itinerary...
              </Text>
            </View>

            <Text className="text-gray-500 mb-6 text-center">
              Please wait a few seconds
            </Text>

            <ActivityIndicator size="large" color="#000" />

          </View>
        </View>
      )}

    </View>
  );
}
