import Skeleton from "@/components/Skeleton";
import {
  ContinentSection,
  Destination,
  getExploreCacheState,
  prefetchExploreData,
  subscribeToExploreCache,
} from "@/lib/exploreCache";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ExploreScreen() {
  const router = useRouter();
  const locationCardShadowStyle = {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  };

  // Initialise from whatever the cache already holds (may be ready instantly).
  const initialState = getExploreCacheState();
  const [loading, setLoading] = useState(
    initialState.loading || !initialState.data,
  );
  const [featuredDestination, setFeaturedDestination] =
    useState<Destination | null>(
      initialState.data?.featuredDestination ?? null,
    );
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>(
    initialState.data?.popularDestinations ?? [],
  );
  const [popularAttractions, setPopularAttractions] = useState<Destination[]>(
    initialState.data?.popularAttractions ?? [],
  );
  const [continentSections, setContinentSections] = useState<
    ContinentSection[]
  >(initialState.data?.continentSections ?? []);

  useEffect(() => {
    // If data is already in the cache, nothing to do.
    if (initialState.data) return;

    // Start the fetch if it hasn't started yet (home screen may have already kicked it off).
    prefetchExploreData();

    // Subscribe so we get the result as soon as it lands.
    const unsubscribe = subscribeToExploreCache((state) => {
      if (state.data) {
        setFeaturedDestination(state.data.featuredDestination);
        setPopularDestinations(state.data.popularDestinations);
        setPopularAttractions(state.data.popularAttractions);
        setContinentSections(state.data.continentSections);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const getCountryFlag = (countryCode: string) => {
    const flagMap: Record<string, string> = {
      FR: "🇫🇷", // France
      BE: "🇧🇪", // Belgium
      GR: "🇬🇷", // Greece
      US: "🇺🇸", // United States
      JP: "🇯🇵", // Japan
      IT: "🇮🇹", // Italy
      ES: "🇪🇸", // Spain
      NL: "🇳🇱", // Netherlands
      GB: "🇬🇧", // United Kingdom
      UK: "🇬🇧", // United Kingdom
      TH: "🇹🇭", // Thailand
      SG: "🇸🇬", // Singapore
      AE: "🇦🇪", // UAE
      ZA: "🇿🇦", // South Africa
      AU: "🇦🇺", // Australia
      IN: "🇮🇳", // India
      BR: "🇧🇷", // Brazil
      EG: "��", // Egypt
      TR: "�🇷", // Turkey
      KR: "�🇷", // South Korea
      MX: "🇲🇽", // Mexico
      PT: "🇵🇹", // Portugal
      AT: "🇦🇹", // Austria
      CZ: "🇨🇿", // Czech Republic
      HU: "🇭🇺", // Hungary
      RU: "�🇺", // Russia
      SE: "🇸🇪", // Sweden
      NO: "🇳🇴", // Norway
      FI: "�🇮", // Finland
      PL: "🇵🇱", // Poland
      DE: "🇩🇪", // Germany
      CN: "🇨🇳", // China
      ID: "🇮🇩", // Indonesia
      PH: "🇵🇭", // Philippines
      MY: "🇲🇾", // Malaysia
      AR: "��", // Argentina
      PE: "🇵🇪", // Peru
    };
    return flagMap[countryCode] || "🌍";
  };

  const handleDestinationPress = (destination: Destination) => {
    router.push(
      ("/discover/[destinationId]?name=" +
        encodeURIComponent(destination.name) +
        "&country=" +
        encodeURIComponent(destination.country) +
        "&countryCode=" +
        destination.countryCode) as any,
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <ScrollView className="flex-1">
          {/* Title Skeleton */}
          <View className="px-6 pt-6 mb-4">
            <Skeleton height={32} width={120} />
          </View>

          {/* Popular Attractions Skeleton */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Skeleton height={24} width={180} />
              <Skeleton height={16} width={60} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <View key={index} className="mr-4">
                  <View
                    className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                    style={locationCardShadowStyle}
                  >
                    <Skeleton height={96} width={160} />
                    <View className="p-3">
                      <Skeleton height={16} width={120} />
                      <View className="flex-row items-center mt-1">
                        <Skeleton height={16} width={20} />
                        <Skeleton height={12} width={80} className="ml-1" />
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Skeleton height={12} width={12} />
                        <Skeleton height={12} width={40} className="ml-1" />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Discover Section Skeleton */}
          <View className="mb-6">
            <Skeleton height={24} width={100} className="px-6 mb-4" />

            {/* Three rows of skeletons */}
            {[1, 2, 3, 4].map((rowIndex) => (
              <View key={rowIndex} className="mb-4">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                    <View key={`${rowIndex}-${index}`} className="mr-4">
                      <View
                        className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                        style={locationCardShadowStyle}
                      >
                        <Skeleton height={96} width={160} />
                        <View className="p-3">
                          <Skeleton height={16} width={120} />
                          <View className="flex-row items-center mt-1">
                            <Skeleton height={16} width={20} />
                            <Skeleton height={12} width={80} className="ml-1" />
                          </View>
                          <View className="flex-row items-center mt-1">
                            <Skeleton height={12} width={12} />
                            <Skeleton height={12} width={40} className="ml-1" />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>

          {/* Discover Section Skeleton */}
          <View className="mb-6">
            <Skeleton height={24} width={100} className="px-6 mb-4" />

            {/* Three rows of skeletons */}
            {[1, 2, 3, 4].map((rowIndex) => (
              <View key={rowIndex} className="mb-4">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                    <View key={`${rowIndex}-${index}`} className="mr-4">
                      <View
                        className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                        style={locationCardShadowStyle}
                      >
                        <Skeleton height={96} width={160} />
                        <View className="p-3">
                          <Skeleton height={16} width={120} />
                          <View className="flex-row items-center mt-1">
                            <Skeleton height={16} width={20} />
                            <Skeleton height={12} width={80} className="ml-1" />
                          </View>
                          <View className="flex-row items-center mt-1">
                            <Skeleton height={12} width={12} />
                            <Skeleton height={12} width={40} className="ml-1" />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView className="flex-1">
        {/* Explore Title */}
        <View className="px-6 pt-6 mb-4">
          <Text className="text-2xl font-bold">Explore</Text>
        </View>

        {/* Popular Attractions */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-xl font-bold">Popular Attractions</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 text-sm">See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
          >
            {popularAttractions.map((destination) => (
              <TouchableOpacity
                key={destination.id}
                onPress={() => handleDestinationPress(destination)}
                className="mr-4"
              >
                <View
                  className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                  style={locationCardShadowStyle}
                >
                  <Image
                    source={{ uri: destination.image }}
                    className="w-full h-24"
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <Text className="font-semibold text-gray-800 text-sm">
                      {destination.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-lg mr-1">
                        {getCountryFlag(destination.countryCode)}
                      </Text>
                      <Text className="text-gray-600 text-xs">
                        {destination.country}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text className="text-gray-600 text-xs ml-1">
                        {destination.rating}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Discover Section */}
        <View className="mb-6">
          <Text className="text-xl font-bold px-6 mb-4">Discover</Text>

          {/* First horizontal scroll - Major Cities */}
          <View className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
            >
              {popularDestinations.slice(0, 8).map((destination) => (
                <TouchableOpacity
                  key={`city-${destination.id}`}
                  onPress={() => handleDestinationPress(destination)}
                  className="mr-4"
                >
                  <View
                    className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                    style={locationCardShadowStyle}
                  >
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">
                        {destination.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">
                          {getCountryFlag(destination.countryCode)}
                        </Text>
                        <Text className="text-gray-600 text-xs">
                          {destination.country}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">
                          {destination.rating}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Second horizontal scroll */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
            >
              {popularDestinations.slice(8, 16).map((destination) => (
                <TouchableOpacity
                  key={`capital-${destination.id}`}
                  onPress={() => handleDestinationPress(destination)}
                  className="mr-4"
                >
                  <View
                    className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                    style={locationCardShadowStyle}
                  >
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">
                        {destination.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">
                          {getCountryFlag(destination.countryCode)}
                        </Text>
                        <Text className="text-gray-600 text-xs">
                          {destination.country}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">
                          {destination.rating}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Third horizontal scroll - Additional Locations */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
            >
              {popularDestinations.slice(16, 24).map((destination) => (
                <TouchableOpacity
                  key={`additional-${destination.id}`}
                  onPress={() => handleDestinationPress(destination)}
                  className="mr-4"
                >
                  <View
                    className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                    style={locationCardShadowStyle}
                  >
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">
                        {destination.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">
                          {getCountryFlag(destination.countryCode)}
                        </Text>
                        <Text className="text-gray-600 text-xs">
                          {destination.country}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">
                          {destination.rating}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Fourth horizontal scroll - More Major Cities */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
            >
              {popularDestinations.slice(24, 32).map((destination) => (
                <TouchableOpacity
                  key={`major-${destination.id}`}
                  onPress={() => handleDestinationPress(destination)}
                  className="mr-4"
                >
                  <View
                    className="bg-white rounded-xl shadow-md overflow-hidden w-40 border border-purple-200"
                    style={locationCardShadowStyle}
                  >
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">
                        {destination.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">
                          {getCountryFlag(destination.countryCode)}
                        </Text>
                        <Text className="text-gray-600 text-xs">
                          {destination.country}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">
                          {destination.rating}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
