import ReservationUploadPanel from "@/components/ReservationUploadPanel";
import {
  PendingReservationUpload,
  ReservationUploadTypeKey,
  uploadPendingReservationFilesForTrip,
} from "@/lib/reservationUploads";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useAuth } from "../../context/AuthContext";
import { createTrip, createTripMembers } from "../../lib/TripService";

export default function CreateTripScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
  });
  const [destinationInput, setDestinationInput] = useState("");
  const [members, setMembers] = useState<{ name: string; email: string }[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedReservationTypeKey, setSelectedReservationTypeKey] =
    useState<ReservationUploadTypeKey | null>(null);
  const [pendingUploadsByType, setPendingUploadsByType] = useState<
    Partial<Record<ReservationUploadTypeKey, PendingReservationUpload[]>>
  >({});

  const hasPendingUploads = Object.values(pendingUploadsByType).some(
    (uploads) => (uploads?.length || 0) > 0,
  );

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMemberChange = (
    index: number,
    field: "name" | "email",
    value: string,
  ) => {
    setMembers((prev) => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = { name: "", email: "" };
      }
      updated[index][field] = value;
      return updated;
    });
  };

  const addMemberField = () => {
    setMembers((prev) => [...prev, { name: "", email: "" }]);
  };

  const removeMemberField = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPendingUpload = (
    typeKey: ReservationUploadTypeKey,
    file: {
      uri: string;
      name?: string | null;
      mimeType?: string | null;
      size?: number;
    },
  ): PendingReservationUpload => ({
    id: `${typeKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    typeKey,
    uri: file.uri,
    name: file.name || file.uri.split("/").pop() || `${typeKey}-${Date.now()}`,
    mimeType: file.mimeType || "application/octet-stream",
    size: file.size,
    kind: (file.mimeType || "").startsWith("image/") ? "image" : "document",
    status: "pending",
  });

  const addUploadsForType = (
    typeKey: ReservationUploadTypeKey,
    uploads: PendingReservationUpload[],
  ) => {
    if (!uploads.length) {
      return;
    }

    setPendingUploadsByType((prev) => ({
      ...prev,
      [typeKey]: [...(prev[typeKey] || []), ...uploads],
    }));
  };

  const handleToggleReservationType = (typeKey: ReservationUploadTypeKey) => {
    setSelectedReservationTypeKey((prev) =>
      prev === typeKey ? null : typeKey,
    );
  };

  const handlePickReservationImage = async (
    typeKey: ReservationUploadTypeKey,
  ) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Needed",
        "Please allow photo library access to upload reservation screenshots.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    addUploadsForType(
      typeKey,
      result.assets.map((asset) =>
        buildPendingUpload(typeKey, {
          uri: asset.uri,
          name: asset.fileName,
          mimeType: asset.mimeType,
          size: asset.fileSize,
        }),
      ),
    );
  };

  const handlePickReservationDocument = async (
    typeKey: ReservationUploadTypeKey,
  ) => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ["image/*", "application/pdf", "text/plain", "application/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    addUploadsForType(
      typeKey,
      result.assets.map((asset) =>
        buildPendingUpload(typeKey, {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        }),
      ),
    );
  };

  const handleRemoveReservationUpload = (
    typeKey: ReservationUploadTypeKey,
    uploadId: string,
  ) => {
    setPendingUploadsByType((prev) => ({
      ...prev,
      [typeKey]: (prev[typeKey] || []).filter(
        (upload) => upload.id !== uploadId,
      ),
    }));
  };

  const handleDateChange = (
    event: any,
    selectedDate: Date | undefined,
    type: "start" | "end",
  ) => {
    if (event.type === "set" && selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0];
      if (type === "start") {
        setStartDate(selectedDate);
        handleInputChange("start_date", dateString);
      } else {
        setEndDate(selectedDate);
        handleInputChange("end_date", dateString);
      }
    }
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleCreateTrip = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a trip");
      return;
    }

    const normalizedData = {
      title: formData.title.trim(),
      destination: destinationInput.trim(),
      start_date: formData.start_date.trim(),
      end_date: formData.end_date.trim(),
    };

    const missingFields: string[] = [];
    if (!normalizedData.title) missingFields.push("Trip Title");
    if (!normalizedData.destination) missingFields.push("Destination");
    if (!normalizedData.start_date) missingFields.push("Start Date");
    if (!normalizedData.end_date) missingFields.push("End Date");

    if (missingFields.length > 0) {
      Alert.alert("Error", `Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    if (
      new Date(normalizedData.start_date) > new Date(normalizedData.end_date)
    ) {
      Alert.alert("Error", "End Date must be on or after Start Date");
      return;
    }

    setLoading(true);

    try {
      const tripData = await createTrip(
        normalizedData.title,
        normalizedData.destination,
        normalizedData.start_date,
        normalizedData.end_date,
        user.id,
      );

      const tripId = tripData?.[0]?.id;
      if (!tripId) {
        throw new Error("Trip creation did not return a valid trip id");
      }

      const validMembers = members.filter(
        (member) => member.name && member.email,
      );
      if (validMembers.length > 0) {
        await createTripMembers(tripId, validMembers);
      }

      let uploadMessage = "";
      if (hasPendingUploads) {
        try {
          const { failed } = await uploadPendingReservationFilesForTrip(
            tripId,
            user.id,
            pendingUploadsByType,
          );

          if (failed.length > 0) {
            uploadMessage = ` ${failed.length} reservation file(s) could not be uploaded.`;
          }
        } catch (uploadError) {
          console.error("Error linking reservation uploads:", uploadError);
          uploadMessage =
            " Reservation files were selected, but some could not be linked to the trip.";
        }
      }

      Alert.alert("Success", `Trip created successfully.${uploadMessage}`);
      router.push("/(tabs)/home");
    } catch (error: any) {
      console.error("Error creating trip:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });

      if (error?.code === "42501") {
        Alert.alert(
          "Permission Error",
          "You don't have permission to create trips. Please make sure you're properly logged in or contact support.",
        );
      } else {
        Alert.alert(
          "Error",
          `Failed to create trip: ${error?.message || "Unknown error"}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white px-6 pt-12 pb-6">
            <Text className="text-2xl font-bold text-gray-800">
              Create New Trip
            </Text>
            <Text className="text-gray-600 mt-2">Plan your next adventure</Text>
          </View>

          <View className="bg-white px-6 py-4">
            <Text className="text-gray-700 text-base font-semibold mb-2">
              Trip Title
            </Text>
            <TextInput
              className="w-full border border-gray-300 rounded-lg p-4 mb-4"
              placeholder="Enter trip title"
              value={formData.title}
              onChangeText={(value) => handleInputChange("title", value)}
            />

            <Text className="text-gray-700 text-base font-semibold mb-2">
              Destination
            </Text>
            <GooglePlacesAutocomplete
              placeholder="Search for a city or destination"
              onPress={(data) => {
                const value = data.description || "";
                setDestinationInput(value);
                handleInputChange("destination", value);
              }}
              query={{
                key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
                language: "en",
                types: "(cities)",
              }}
              styles={{
                textInput: {
                  height: 48,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  marginBottom: 16,
                  fontSize: 16,
                },
                container: {
                  flex: 0,
                },
              }}
              textInputProps={{
                placeholderTextColor: "#9ca3af",
                value: destinationInput,
                onChangeText: (value: string) => {
                  setDestinationInput(value);
                  handleInputChange("destination", value);
                },
              }}
              fetchDetails={true}
              onTimeout={() => console.log("Google Places timeout")}
              onFail={(error) => console.error("Google Places error:", error)}
              minLength={2}
              debounce={300}
            />

            <Text className="text-gray-700 text-base font-semibold mb-2">
              Start Date
            </Text>
            <TouchableOpacity
              className="w-full border border-gray-300 rounded-lg p-4 mb-4"
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text className="text-gray-800">
                {formData.start_date || "Select start date"}
              </Text>
            </TouchableOpacity>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, date) =>
                  handleDateChange(event, date, "start")
                }
              />
            )}

            <Text className="text-gray-700 text-base font-semibold mb-2">
              End Date
            </Text>
            <TouchableOpacity
              className="w-full border border-gray-300 rounded-lg p-4 mb-6"
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text className="text-gray-800">
                {formData.end_date || "Select end date"}
              </Text>
            </TouchableOpacity>

            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, "end")}
              />
            )}

            <Text className="text-xl font-bold text-neutral-textPrimary mb-4">
              Reservations
            </Text>

            <ReservationUploadPanel
              selectedTypeKey={selectedReservationTypeKey}
              uploadsByType={pendingUploadsByType}
              disabled={loading}
              onToggleType={handleToggleReservationType}
              onPickImage={handlePickReservationImage}
              onPickDocument={handlePickReservationDocument}
              onRemoveUpload={handleRemoveReservationUpload}
            />

            <TouchableOpacity
              onPress={handleCreateTrip}
              className="bg-blue-500 py-3 rounded-lg items-center mb-4"
              disabled={loading}
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : null}
                <Text className="text-white font-semibold text-base ml-2">
                  {loading
                    ? hasPendingUploads
                      ? "Creating Trip & Uploading Files..."
                      : "Creating..."
                    : "Create Trip"}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="border-t border-gray-200 pt-4">
              <Text className="text-gray-700 text-base font-semibold mb-3">
                Trip Members (Optional)
              </Text>

              <ScrollView
                className="max-h-48"
                keyboardShouldPersistTaps="handled"
              >
                {members.map((member, index) => (
                  <View key={index} className="flex-row mb-3">
                    <TextInput
                      className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
                      placeholder="Name"
                      value={member.name}
                      onChangeText={(value) =>
                        handleMemberChange(index, "name", value)
                      }
                    />
                    <TextInput
                      className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
                      placeholder="Email"
                      value={member.email}
                      onChangeText={(value) =>
                        handleMemberChange(index, "email", value)
                      }
                    />
                    <TouchableOpacity
                      onPress={() => removeMemberField(index)}
                      className="bg-red-500 px-3 py-2 rounded-lg justify-center"
                    >
                      <Text className="text-white text-sm">Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={addMemberField}
                className="bg-green-500 py-2 rounded-lg items-center mt-2"
              >
                <Text className="text-white font-semibold">+ Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
