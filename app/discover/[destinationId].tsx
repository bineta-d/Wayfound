import GooglePlacesService from '@/lib/googlePlacesService';
import WikipediaService from '@/lib/wikipediaService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface DiscoverSection {
  title: string;
  icon: string;
  places: Array<{
    name: string;
    description: string;
    image: string;
    rating: number;
  }>;
}

export default function DiscoverDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState({
    name: params.name as string || '',
    country: params.country as string || '',
    countryCode: params.countryCode as string || '',
    image: '',
    description: ''
  });
  const [discoverSections, setDiscoverSections] = useState<DiscoverSection[]>([]);

  const getCountryFlag = (countryCode: string) => {
    const flagMap: Record<string, string> = {
      'FR': '🇫🇷',
      'BE': '🇧🇪',
      'GR': '🇬🇷',
      'US': '🇺🇸',
      'JP': '🇯🇵',
    };
    return flagMap[countryCode] || '🌍';
  };

  useEffect(() => {
    fetchDestinationData();
  }, [params.name]);

  const fetchDestinationData = async () => {
    try {
      setLoading(true);
      const destinationName = params.name as string;

      if (!destinationName) {
        throw new Error('Destination name is required');
      }

      // Get destination info from Wikipedia
      const wikiInfo = await WikipediaService.getDestinationInfo(destinationName);

      // Get real data from Google Places API
      const [attractions, restaurants, photoSpots] = await Promise.all([
        GooglePlacesService.getAttractions(destinationName).catch(() => []),
        GooglePlacesService.getRestaurants(destinationName).catch(() => []),
        GooglePlacesService.getPhotoSpots(destinationName).catch(() => [])
      ]);

      // Convert Google Places data to our format
      const convertPlaces = (places: any[]) =>
        places.slice(0, 6).map(place => ({
          name: place.name,
          description: place.formatted_address || `${place.name} in ${destinationName}`,
          image: place.photos?.[0]
            ? GooglePlacesService.getPhotoUrl(place.photos[0].photo_reference, 200)
            : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
          rating: place.rating || 4.5
        }));

      // Build dynamic sections
      const sections: DiscoverSection[] = [];

      if (attractions.length > 0) {
        sections.push({
          title: 'Top Attractions',
          icon: 'star',
          places: convertPlaces(attractions)
        });
      }

      if (restaurants.length > 0) {
        sections.push({
          title: 'Must Try Foods',
          icon: 'restaurant',
          places: convertPlaces(restaurants)
        });
      }

      if (photoSpots.length > 0) {
        sections.push({
          title: 'Photo Spots',
          icon: 'camera',
          places: convertPlaces(photoSpots)
        });
      }

      // Get transport options (generic for most cities)
      const transportPlaces = [
        { name: 'Public Transit', description: 'Local buses, trains, and metro systems', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200', rating: 4.3 },
        { name: 'Taxi Services', description: 'Traditional taxis and ride-sharing options', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.2 },
        { name: 'Car Rentals', description: 'Vehicle rental services for exploring', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.4 },
        { name: 'Airport Transfer', description: 'Shuttle services to/from airport', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.1 },
        { name: 'Bike Rentals', description: 'Bicycle rental for local exploration', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.5 },
        { name: 'Walking Tours', description: 'Guided tours on foot', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.6 }
      ];

      sections.push({
        title: 'Transport',
        icon: 'bus',
        places: transportPlaces
      });

      // Update destination info
      setDestination(prev => ({
        ...prev,
        image: wikiInfo.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
        description: wikiInfo.summary || `${destinationName} is a fascinating destination offering unique experiences, cultural attractions, and memorable adventures for visitors to explore and enjoy.`
      }));

      setDiscoverSections(sections);
    } catch (error) {
      console.error('Error fetching destination data:', error);
      // Fallback to mock data if API fails
      fetchMockData();
    } finally {
      setLoading(false);
    }
  };

  const fetchMockData = () => {
    // Fallback mock data for when APIs fail
    const mockDestinationData = {
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      description: `${params.name} is a vibrant destination known for its rich history, stunning architecture, and cultural significance. From iconic landmarks to hidden gems, this city offers endless opportunities for exploration and discovery.`
    };

    const mockSections: DiscoverSection[] = [
      {
        title: 'Top Attractions',
        icon: 'star',
        places: [
          { name: 'Historic Landmark', description: 'Iconic attraction and symbol of the city', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=200', rating: 4.7 },
          { name: 'City Museum', description: 'World-class museum with extensive collections', image: 'https://images.unsplash.com/photo-1566472247105-b5b942703b0a?w=200', rating: 4.8 },
          { name: 'Central Park', description: 'Beautiful green space in the heart of the city', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.6 }
        ]
      },
      {
        title: 'Must Try Foods',
        icon: 'restaurant',
        places: [
          { name: 'Local Specialty', description: 'Famous local dish you must try', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.9 },
          { name: 'Street Food', description: 'Authentic local street food experience', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.7 },
          { name: 'Fine Dining', description: 'Upscale restaurant with local cuisine', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.8 }
        ]
      },
      {
        title: 'Photo Spots',
        icon: 'camera',
        places: [
          { name: 'Scenic Viewpoint', description: 'Best panoramic views of the city', image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=200', rating: 4.8 },
          { name: 'Historic District', description: 'Charming area with photogenic architecture', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.7 },
          { name: 'Waterfront', description: 'Beautiful waterfront views', image: 'https://images.unsplash.com/photo-1549144511-f099e777c147?w=200', rating: 4.6 }
        ]
      }
    ];

    setDestination(prev => ({ ...prev, ...mockDestinationData }));
    setDiscoverSections(mockSections);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600">Loading destination...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header Image */}
      <View className="relative h-64">
        <Image
          source={{ uri: destination.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-6 bg-white/20 backdrop-blur-sm rounded-full p-2"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Destination Header */}
      <View className="px-6 py-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-900 mb-2">{destination.name}</Text>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">{getCountryFlag(destination.countryCode)}</Text>
              <Text className="text-lg text-gray-600">
                {destination.countryCode === 'US' ? `${destination.name}, FL, USA` : `${destination.name}, ${destination.country}`}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-gray-700 leading-relaxed mb-6">{destination.description}</Text>

        {/* Generate Itinerary Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center mb-8"
          onPress={() => router.push('/screens/aiPlannerScreen' as any)}
        >
          <Ionicons name="sparkles" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Generate Itinerary</Text>
        </TouchableOpacity>

        {/* Discover Sections */}
        {discoverSections.map((section, index) => (
          <View key={index} className="mb-8">
            <View className="flex-row items-center mb-4">
              <Ionicons name={section.icon as any} size={24} color="#007AFF" />
              <Text className="text-xl font-bold text-gray-800 ml-3">{section.title}</Text>
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
                >
                  <View className="bg-white rounded-xl shadow-sm overflow-hidden w-40">
                    <Image
                      source={{ uri: place.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm mb-1">{place.name}</Text>
                      <Text className="text-gray-600 text-xs mb-2" numberOfLines={2}>{place.description}</Text>
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">{place.rating}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
