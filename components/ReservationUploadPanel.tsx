import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  getReservationUploadOption,
  PendingReservationUpload,
  RESERVATION_UPLOAD_OPTIONS,
  ReservationUploadTypeKey,
} from "@/lib/reservationUploads";

interface ReservationUploadPanelProps {
  selectedTypeKey: ReservationUploadTypeKey | null;
  uploadsByType: Partial<Record<ReservationUploadTypeKey, PendingReservationUpload[]>>;
  disabled?: boolean;
  onToggleType: (typeKey: ReservationUploadTypeKey) => void;
  onPickImage: (typeKey: ReservationUploadTypeKey) => void;
  onPickDocument: (typeKey: ReservationUploadTypeKey) => void;
  onRemoveUpload: (typeKey: ReservationUploadTypeKey, uploadId: string) => void;
}

const formatFileSize = (size?: number) => {
  if (!size) {
    return null;
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ReservationUploadPanel({
  selectedTypeKey,
  uploadsByType,
  disabled,
  onToggleType,
  onPickImage,
  onPickDocument,
  onRemoveUpload,
}: ReservationUploadPanelProps) {
  const selectedOption = selectedTypeKey
    ? getReservationUploadOption(selectedTypeKey) || null
    : null;

  const selectedUploads = selectedOption
    ? uploadsByType[selectedOption.key] || []
    : [];

  const latestUpload = selectedUploads[selectedUploads.length - 1] || null;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {RESERVATION_UPLOAD_OPTIONS.map((option) => {
          const isSelected = selectedTypeKey === option.key;

          return (
            <TouchableOpacity
              key={option.key}
              className={`items-center mr-6 rounded-2xl px-2 py-2 ${isSelected ? "bg-gray-100" : ""}`}
              onPress={() => onToggleType(option.key)}
              disabled={disabled}
            >
              <View className={`${option.iconBgClassName} p-3 rounded-full mb-1`}>
                <Ionicons
                  name={option.icon as never}
                  size={20}
                  color={option.iconColor}
                />
              </View>
              <Text
                className={`text-xs ${isSelected ? "text-gray-900 font-semibold" : "text-neutral-textSecondary"}`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedOption ? (
        <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              {selectedOption.label} Files
            </Text>
            <TouchableOpacity
              onPress={() => onToggleType(selectedOption.key)}
              disabled={disabled}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-xl shadow-sm p-4 mb-4 items-center justify-center min-h-[150px] border border-gray-100">
            {latestUpload?.kind === "image" ? (
              <TouchableOpacity
                className="w-full"
                disabled={disabled}
                onPress={() => Linking.openURL(latestUpload.publicUrl || latestUpload.uri)}
              >
                <View className="w-full">
                  <View className="bg-blue-50 self-center p-3 rounded-full mb-3">
                    <Ionicons name="image-outline" size={24} color="#3B82F6" />
                  </View>
                  <Text className="text-sm text-gray-700 text-center mb-1" numberOfLines={1}>
                    {latestUpload.name}
                  </Text>
                  <Text className="text-xs text-gray-400 text-center">
                    Latest selected file
                  </Text>
                </View>
              </TouchableOpacity>
            ) : latestUpload ? (
              <TouchableOpacity
                className="items-center"
                disabled={disabled}
                onPress={() => Linking.openURL(latestUpload.publicUrl || latestUpload.uri)}
              >
                <View className="bg-blue-50 p-4 rounded-full mb-3">
                  <Ionicons name="document-outline" size={32} color="#3B82F6" />
                </View>
                <Text className="text-sm text-gray-700 text-center" numberOfLines={2}>
                  {latestUpload.name}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="items-center justify-center py-4">
                <View className="bg-blue-50 p-4 rounded-full mb-3">
                  <Ionicons name="cloud-upload-outline" size={32} color="#3B82F6" />
                </View>
                <Text className="text-gray-500 text-center">
                  Upload screenshots, PDFs, or confirmations for{"\n"}
                  {selectedOption.label.toLowerCase()}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row mb-4">
            <TouchableOpacity
              className="flex-1 bg-blue-500 rounded-xl py-3 items-center mr-3"
              onPress={() => onPickImage(selectedOption.key)}
              disabled={disabled}
            >
              <Text className="text-white font-semibold">Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-white border border-gray-300 rounded-xl py-3 items-center"
              onPress={() => onPickDocument(selectedOption.key)}
              disabled={disabled}
            >
              <Text className="text-gray-700 font-semibold">Add File</Text>
            </TouchableOpacity>
          </View>

          {selectedUploads.length > 0 ? (
            <View className="bg-white rounded-xl border border-gray-200 px-3 py-3">
              <Text className="text-sm font-semibold text-gray-800 mb-3">
                Uploaded in this section ({selectedUploads.length})
              </Text>
              <View>
                {selectedUploads.map((upload, index) => (
                  <View
                    key={upload.id}
                    className={`flex-row items-center justify-between bg-gray-50 rounded-xl px-3 py-3 ${index < selectedUploads.length - 1 ? "mb-2" : ""}`}
                  >
                    <TouchableOpacity
                      className="flex-1 flex-row items-center mr-3"
                      onPress={() => Linking.openURL(upload.publicUrl || upload.uri)}
                      disabled={disabled}
                    >
                      <View className="bg-white rounded-full p-2 mr-3">
                        <Ionicons
                          name={upload.kind === "image" ? "image-outline" : "document-text-outline"}
                          size={18}
                          color="#3B82F6"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                          {upload.name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {formatFileSize(upload.size) || "File ready"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onRemoveUpload(selectedOption.key, upload.id)}
                      disabled={disabled}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}