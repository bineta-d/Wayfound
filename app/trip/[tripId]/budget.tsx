import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import PrimaryButton from "@/components/PrimaryButton";
import { useLocalSearchParams } from "expo-router";

export default function BudgetScreen() {
  const { tripId } = useLocalSearchParams();

  const [activities, setActivities] = useState("");
  const [transport, setTransport] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudget();
    calculateAutoBudget();
  }, []);

  const loadBudget = async () => {
    if (!tripId) return;

    const { data } = await supabase
      .from("budgets")
      .select("*")
      .eq("trip_id", tripId)
      .single();

    if (data) {
      setActivities(String(data.activities ?? ""));
      setTransport(String(data.transport ?? ""));
      setAccommodation(String(data.accommodation ?? ""));
    }
  };

  const calculateAutoBudget = async () => {
  if (!tripId) return;

  // Activities
  const { data: activitiesData } = await supabase
    .from("activities")
    .select("price")
    .eq("trip_id", tripId);

  const activitiesTotal =
    activitiesData?.reduce((sum, a) => sum + (a.price || 0), 0) || 0;

  // Transport
  const { data: transportData } = await supabase
    .from("travel_transportation")
    .select("price")
    .eq("trip_id", tripId);

  const transportTotal =
    transportData?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;

  // Accommodation
  const { data: accommodationData } = await supabase
    .from("accommodations")
    .select("total_price")
    .eq("trip_id", tripId);

  const accommodationTotal =
    accommodationData?.reduce((sum, a) => sum + (a.total_price || 0), 0) || 0;

  // Update UI
  setActivities(String(activitiesTotal));
  setTransport(String(transportTotal));
  setAccommodation(String(accommodationTotal));
};

  const saveBudget = async () => {
    if (!tripId) return;

    setLoading(true);

    const payload = {
      trip_id: tripId,
      activities: Number(activities) || 0,
      transport: Number(transport) || 0,
      accommodation: Number(accommodation) || 0,
    };

    const { error } = await supabase
      .from("budgets")
      .upsert(payload, { onConflict: "trip_id" });

    setLoading(false);

    if (error) {
        console.log("Save Error:", error);
        Alert.alert("Error", "Failed to save budget");
        return;
    }

      Alert.alert("Success", "Budget saved successfully!!!");
  };

  const total =
    (Number(activities) || 0) +
    (Number(transport) || 0) +
    (Number(accommodation) || 0);

  return (
    <View className="bg-white px-6 py-6">
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Trip Budget
      </Text>

      {/* Activities */}
      <Text className="mb-1">Activities</Text>
      <TextInput
        value={activities}
        onChangeText={setActivities}
        keyboardType="numeric"
        placeholder="0"
        className="border border-gray-300 rounded-lg p-3 mb-4"
      />

      {/* Transport */}
      <Text className="mb-1">Transport</Text>
      <TextInput
        value={transport}
        onChangeText={setTransport}
        keyboardType="numeric"
        placeholder="0"
        className="border border-gray-300 rounded-lg p-3 mb-4"
      />

      {/* Accommodation */}
      <Text className="mb-1">Accommodation</Text>
      <TextInput
        value={accommodation}
        onChangeText={setAccommodation}
        keyboardType="numeric"
        placeholder="0"
        className="border border-gray-300 rounded-lg p-3 mb-4"
      />

      {/* Total */}
      <Text className="text-lg font-semibold mb-1">
        Total: ${total}
      </Text>

      <PrimaryButton
        title={loading ? "Saving..." : "Save Budget"}
        onPress={saveBudget}
        disabled={loading}
      />
      <PrimaryButton
        title="Auto Calculate"
        onPress={calculateAutoBudget}
      />
    </View>
  );
}