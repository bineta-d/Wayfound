import GooglePlacesService from "@/lib/googlePlacesService";
import WikipediaService from "@/lib/wikipediaService";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";

interface DiscoverSection {
  title: string;
  icon: string;
  places: Array<PlaceSummary>;
}

interface PlaceSummary {
  placeId: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  formatted_address?: string;
  lat?: number;
  lng?: number;
}

interface PlaceDetailsInfo extends PlaceSummary {
  website?: string;
  phone_number?: string;
  opening_hours?: string[];
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    relative_time_description?: string;
  }>;
  photos: string[];
  wikiSummary?: string | null;
}

export default function DiscoverDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState({
    name: (params.name as string) || "",
    country: (params.country as string) || "",
    countryCode: (params.countryCode as string) || "",
    image: "",
    description: "",
  });
  const [discoverSections, setDiscoverSections] = useState<DiscoverSection[]>(
    [],
  );

  const [selectedPlace, setSelectedPlace] = useState<PlaceSummary | null>(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] =
    useState<PlaceDetailsInfo | null>(null);
  const [isPlaceModalVisible, setIsPlaceModalVisible] = useState(false);
  const [placeDetailsLoading, setPlaceDetailsLoading] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerImages, setImageViewerImages] = useState<
    Array<{ url: string }>
  >([]);

  const getCountryFlag = (countryCode: string) => {
    const flagMap: Record<string, string> = {
      FR: "🇫🇷",
      BE: "🇧🇪",
      GR: "🇬🇷",
      US: "🇺🇸",
      JP: "🇯🇵",
    };
    return flagMap[countryCode] || "🌍";
  };

  useEffect(() => {
    fetchDestinationData();
  }, [params.name]);

  const fetchDestinationData = async () => {
    try {
      setLoading(true);
      const destinationName = params.name as string;

      if (!destinationName) {
        throw new Error("Destination name is required");
      }

      // Get destination info from Wikipedia
      const wikiInfo =
        await WikipediaService.getDestinationInfo(destinationName);

      // Get real data from Google Places API
      const [attractions, restaurants, photoSpots] = await Promise.all([
        GooglePlacesService.getAttractions(destinationName).catch(() => []),
        GooglePlacesService.getRestaurants(destinationName).catch(() => []),
        GooglePlacesService.getPhotoSpots(destinationName).catch(() => []),
      ]);

      // Convert Google Places data to our format
      const convertPlaces = (places: any[]) =>
        places.slice(0, 6).map((place) => ({
          placeId: place.place_id,
          name: place.name,
          description:
            place.formatted_address || `${place.name} in ${destinationName}`,
          formatted_address: place.formatted_address,
          image: place.photos?.[0]
            ? GooglePlacesService.getPhotoUrl(
                place.photos[0].photo_reference,
                200,
              )
            : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200",
          rating: place.rating || 4.5,
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
        }));

      // Build dynamic sections
      const sections: DiscoverSection[] = [];

      if (attractions.length > 0) {
        sections.push({
          title: "Top Attractions",
          icon: "star",
          places: convertPlaces(attractions),
        });
      }

      if (restaurants.length > 0) {
        sections.push({
          title: "Must Try Foods",
          icon: "restaurant",
          places: convertPlaces(restaurants),
        });
      }

      if (photoSpots.length > 0) {
        sections.push({
          title: "Photo Spots",
          icon: "camera",
          places: convertPlaces(photoSpots),
        });
      }

      // Get transport options (generic for most cities)
      const transportPlaces: PlaceSummary[] = [
        {
          placeId: "transport-public-transit",
          name: "Public Transit",
          description: "Local buses, trains, and metro systems",
          image:
            "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200",
          rating: 4.3,
        },
        {
          placeId: "transport-taxi-services",
          name: "Taxi Services",
          description: "Traditional taxis and ride-sharing options",
          image:
            "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
          rating: 4.2,
        },
        {
          placeId: "transport-car-rentals",
          name: "Car Rentals",
          description: "Vehicle rental services for exploring",
          image:
            "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
          rating: 4.4,
        },
        {
          placeId: "transport-airport-transfer",
          name: "Airport Transfer",
          description: "Shuttle services to/from airport",
          image:
            "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
          rating: 4.1,
        },
        {
          placeId: "transport-bike-rentals",
          name: "Bike Rentals",
          description: "Bicycle rental for local exploration",
          image:
            "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
          rating: 4.5,
        },
        {
          placeId: "transport-walking-tours",
          name: "Walking Tours",
          description: "Guided tours on foot",
          image:
            "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
          rating: 4.6,
        },
      ];

      sections.push({
        title: "Transport",
        icon: "bus",
        places: transportPlaces,
      });

      // Update destination info
      setDestination((prev) => ({
        ...prev,
        image:
          wikiInfo.image ||
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
        description:
          wikiInfo.summary ||
          `${destinationName} is a fascinating destination offering unique experiences, cultural attractions, and memorable adventures for visitors to explore and enjoy.`,
      }));

      setDiscoverSections(sections);
    } catch (error) {
      console.error("Error fetching destination data:", error);
      // Fallback to mock data if API fails
      fetchMockData();
    } finally {
      setLoading(false);
    }
  };

  const fetchMockData = () => {
    // Fallback mock data for when APIs fail
    const mockDestinationData = {
      image:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
      description: `${params.name} is a vibrant destination known for its rich history, stunning architecture, and cultural significance. From iconic landmarks to hidden gems, this city offers endless opportunities for exploration and discovery.`,
    };

    const mockSections: DiscoverSection[] = [
      {
        title: "Top Attractions",
        icon: "star",
        places: [
          {
            placeId: "mock-historic-landmark",
            name: "Historic Landmark",
            description: "Iconic attraction and symbol of the city",
            image:
              "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=200",
            rating: 4.7,
          },
          {
            placeId: "mock-city-museum",
            name: "City Museum",
            description: "World-class museum with extensive collections",
            image:
              "https://images.unsplash.com/photo-1566472247105-b5b942703b0a?w=200",
            rating: 4.8,
          },
          {
            placeId: "mock-central-park",
            name: "Central Park",
            description: "Beautiful green space in the heart of the city",
            image:
              "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
            rating: 4.6,
          },
        ],
      },
      {
        title: "Must Try Foods",
        icon: "restaurant",
        places: [
          {
            placeId: "mock-local-specialty",
            name: "Local Specialty",
            description: "Famous local dish you must try",
            image:
              "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
            rating: 4.9,
          },
          {
            placeId: "mock-street-food",
            name: "Street Food",
            description: "Authentic local street food experience",
            image:
              "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
            rating: 4.7,
          },
          {
            placeId: "mock-fine-dining",
            name: "Fine Dining",
            description: "Upscale restaurant with local cuisine",
            image:
              "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
            rating: 4.8,
          },
        ],
      },
      {
        title: "Photo Spots",
        icon: "camera",
        places: [
          {
            placeId: "mock-scenic-viewpoint",
            name: "Scenic Viewpoint",
            description: "Best panoramic views of the city",
            image:
              "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=200",
            rating: 4.8,
          },
          {
            placeId: "mock-historic-district",
            name: "Historic District",
            description: "Charming area with photogenic architecture",
            image:
              "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
            rating: 4.7,
          },
          {
            placeId: "mock-waterfront",
            name: "Waterfront",
            description: "Beautiful waterfront views",
            image:
              "https://images.unsplash.com/photo-1549144511-f099e777c147?w=200",
            rating: 4.6,
          },
        ],
      },
    ];

    setDestination((prev) => ({ ...prev, ...mockDestinationData }));
    setDiscoverSections(mockSections);
  };

  const handleSelectPlace = async (place: PlaceSummary) => {
    setSelectedPlace(place);
    setIsPlaceModalVisible(true);
    setPlaceDetailsLoading(true);

    try {
      const details = await GooglePlacesService.getPlaceDetails(place.placeId);
      const placePhotos = details?.photos?.map((photo: any) =>
        GooglePlacesService.getPhotoUrl(photo.photo_reference, 400),
      ) || [place.image];
      const wikiInfo = await WikipediaService.getDestinationInfo(place.name);

      setSelectedPlaceDetails({
        ...place,
        formatted_address:
          details?.formatted_address || place.formatted_address,
        website: (details as any)?.website,
        phone_number:
          (details as any)?.international_phone_number ||
          (details as any)?.formatted_phone_number,
        opening_hours: (details as any)?.opening_hours?.weekday_text,
        reviews: (details as any)?.reviews?.slice(0, 4).map((review: any) => ({
          author_name: review.author_name,
          rating: review.rating,
          text: review.text,
          relative_time_description: review.relative_time_description,
        })),
        photos: placePhotos,
        wikiSummary: wikiInfo.summary,
      });
    } catch (error) {
      console.error("Error loading place details:", error);
      setSelectedPlaceDetails({
        ...place,
        photos: [place.image],
        wikiSummary: null,
      });
    } finally {
      setPlaceDetailsLoading(false);
    }
  };

  const handleOpenInMaps = () => {
    if (!selectedPlace) {
      return;
    }
    const lat = selectedPlace.lat;
    const lng = selectedPlace.lng;
    const query =
      lat && lng ? `${lat},${lng}` : encodeURIComponent(selectedPlace.name);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch((err) =>
      console.error("Error opening maps:", err),
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Discover",
            headerBackTitle: "Back",
          }}
        />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-gray-600">Loading destination...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Discover",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView className="flex-1 bg-white">
        {/* Header Image */}
        <View className="relative h-64">
          <Image
            source={{ uri: destination.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </View>

        {/* Destination Header */}
        <View className="px-6 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                {destination.name}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">
                  {getCountryFlag(destination.countryCode)}
                </Text>
                <Text className="text-lg text-gray-600">
                  {destination.countryCode === "US"
                    ? "FL, USA"
                    : destination.country}
                </Text>
              </View>
            </View>
          </View>

          {/* Create Trip Button */}
          <TouchableOpacity
            className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center mb-8"
            onPress={() => {
              // Navigate to create trip screen with destination preset
              router.push({
                pathname: "/screens/createTrip",
                params: {
                  destination: destination.name,
                  country: destination.country,
                  countryCode: destination.countryCode,
                },
              } as any);
            }}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Create Trip</Text>
          </TouchableOpacity>

          {/* Discover Sections */}
          {discoverSections.map((section, index) => (
            <View key={index} className="mb-8">
              <View className="flex-row items-center mb-4">
                <Ionicons
                  name={section.icon as any}
                  size={24}
                  color="#007AFF"
                />
                <Text className="text-xl font-bold text-gray-800 ml-3">
                  {section.title}
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 0, paddingRight: 20 }}
              >
                {section.places.map((place, placeIndex) => (
                  <TouchableOpacity
                    key={placeIndex}
                    className="mr-4"
                    onPress={() => handleSelectPlace(place)}
                  >
                    <View className="bg-white rounded-xl shadow-sm overflow-hidden w-40">
                      <Image
                        source={{ uri: place.image }}
                        className="w-full h-24"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <Text className="font-semibold text-gray-800 text-sm mb-1">
                          {place.name}
                        </Text>
                        <Text
                          className="text-gray-600 text-xs mb-2"
                          numberOfLines={2}
                        >
                          {place.description}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text className="text-gray-600 text-xs ml-1">
                            {place.rating}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>

        <Modal
          visible={isPlaceModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPlaceModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <SafeAreaView
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: "88%",
              }}
            >
              <View className="flex-row justify-between items-center mb-4 pt-6 px-6">
                <Text className="text-lg font-semibold text-gray-900">
                  {selectedPlace?.name ?? "Place details"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsPlaceModalVisible(false);
                    setSelectedPlace(null);
                    setSelectedPlaceDetails(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="px-6"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {placeDetailsLoading && (
                  <View className="items-center justify-center py-20">
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text className="mt-3 text-gray-600">
                      Loading place information...
                    </Text>
                  </View>
                )}

                {!placeDetailsLoading && selectedPlaceDetails && (
                  <View className="space-y-4">
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 8 }}
                    >
                      {(
                        selectedPlaceDetails.photos || [
                          selectedPlaceDetails.image,
                        ]
                      ).map((photo, idx) => (
                        <TouchableOpacity
                          key={`${selectedPlaceDetails.placeId}-photo-${idx}`}
                          onPress={() => {
                            const images = (
                              selectedPlaceDetails.photos || [
                                selectedPlaceDetails.image,
                              ]
                            ).map((uri) => ({ url: uri }));
                            setImageViewerImages(images);
                            setImageViewerIndex(idx);
                            setIsImageViewerOpen(true);
                          }}
                          activeOpacity={0.8}
                          className="rounded-xl overflow-hidden mr-3"
                        >
                          <Image
                            source={{ uri: photo }}
                            className="w-72 h-52"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View className="space-y-1">
                      <Text className="text-base font-semibold text-gray-900">
                        Address
                      </Text>
                      <Text className="text-sm text-gray-700">
                        {selectedPlaceDetails.formatted_address ||
                          selectedPlaceDetails.description ||
                          "Not available"}
                      </Text>
                    </View>

                    {selectedPlaceDetails.wikiSummary ? (
                      <View className="space-y-1">
                        <Text className="text-base font-semibold text-gray-900">
                          About
                        </Text>
                        <Text className="text-sm text-gray-700">
                          {selectedPlaceDetails.wikiSummary}
                        </Text>
                      </View>
                    ) : null}

                    {selectedPlaceDetails.rating ? (
                      <View className="flex-row items-center space-x-2">
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text className="text-sm text-gray-700">
                          {selectedPlaceDetails.rating} / 5
                        </Text>
                      </View>
                    ) : null}

                    {selectedPlaceDetails.reviews &&
                      selectedPlaceDetails.reviews.length > 0 && (
                        <View className="space-y-2">
                          <Text className="text-base font-semibold text-gray-900">
                            Reviews
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: 8 }}
                          >
                            {selectedPlaceDetails.reviews.map((review, idx) => (
                              <View
                                key={`review-${idx}`}
                                className="w-60 h-44 bg-white border border-gray-200 rounded-xl p-3 mr-3"
                              >
                                <Text className="text-sm font-semibold text-gray-800">
                                  {review.author_name}
                                </Text>
                                <Text className="text-xs text-gray-500">
                                  {review.relative_time_description}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                  <Ionicons
                                    name="star"
                                    size={14}
                                    color="#FFD700"
                                  />
                                  <Text className="text-sm text-gray-700 ml-1">
                                    {review.rating}
                                  </Text>
                                </View>
                                <Text
                                  className="text-xs text-gray-700 mt-2"
                                  numberOfLines={4}
                                >
                                  {review.text}
                                </Text>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                    <TouchableOpacity
                      className="bg-blue-600 rounded-xl px-4 py-3 items-center"
                      onPress={handleOpenInMaps}
                    >
                      <Text className="text-white font-semibold">
                        Open in Maps
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!placeDetailsLoading && !selectedPlaceDetails && (
                  <Text className="text-center text-gray-500 py-8">
                    Details not available for this place.
                  </Text>
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        <Modal
          visible={isImageViewerOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageViewerOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: "black" }}>
            <ImageViewer
              imageUrls={imageViewerImages}
              index={imageViewerIndex}
              onSwipeDown={() => setIsImageViewerOpen(false)}
              enableSwipeDown={true}
              onClick={() => setIsImageViewerOpen(false)}
              saveToLocalByLongPress={false}
            />
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}
