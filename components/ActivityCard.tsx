import GooglePlacesService from "@/lib/googlePlacesService";
import { Activity } from "@/lib/TripService";
import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

interface Props {
  activity: Activity;
}

const photoCache = new Map<string, string | null>();

export default function ActivityCard({ activity }: Props) {
  const [resolvedPhoto, setResolvedPhoto] = useState<string | null>(
    activity.photo ?? null,
  );

  useEffect(() => {
    let active = true;

    if (activity.photo) {
      setResolvedPhoto(activity.photo);
      return () => {
        active = false;
      };
    }

    const locationName = activity.location_name?.trim();
    if (!locationName) {
      setResolvedPhoto(null);
      return () => {
        active = false;
      };
    }

    const cached = photoCache.get(locationName);
    if (cached !== undefined) {
      setResolvedPhoto(cached);
      return () => {
        active = false;
      };
    }

    setResolvedPhoto(null);

    const loadPhoto = async () => {
      try {
        const results = await GooglePlacesService.searchPlaces(locationName);
        const photoReference = results[0]?.photos?.[0]?.photo_reference;
        const photoUrl = photoReference
          ? GooglePlacesService.getPhotoUrl(photoReference, 800)
          : null;

        photoCache.set(locationName, photoUrl);
        if (active) {
          setResolvedPhoto(photoUrl);
        }
      } catch {
        photoCache.set(locationName, null);
        if (active) {
          setResolvedPhoto(null);
        }
      }
    };

    loadPhoto();

    return () => {
      active = false;
    };
  }, [activity.location_name, activity.photo]);

  return (
    <View className="bg-white rounded-xl border border-neutral-divider overflow-hidden mb-3">
      {/* IMAGE */}
      {resolvedPhoto ? (
        <Image
          source={{ uri: resolvedPhoto }}
          className="w-full h-40"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-40 bg-neutral-200 items-center justify-center">
          <Text className="text-neutral-textSecondary">No image</Text>
        </View>
      )}

      {/* CONTENT */}
      <View className="p-4">
        {/* NAME */}
        <Text className="text-base font-semibold text-neutral-textPrimary">
          {activity.location_name ?? "Activity"}
        </Text>

        {/* RATING + CATEGORY */}
        <View className="flex-row items-center mt-1">
          {activity.rating && (
            <Text className="text-yellow-500 font-semibold mr-2">
              ⭐ {activity.rating.toFixed(1)}
            </Text>
          )}

          {activity.category && (
            <Text className="text-neutral-textSecondary text-xs">
              • {activity.category}
            </Text>
          )}
        </View>

        {/* DESCRIPTION */}
        {activity.description && (
          <Text className="text-neutral-textSecondary mt-2" numberOfLines={2}>
            {activity.description}
          </Text>
        )}
      </View>
    </View>
  );
}
