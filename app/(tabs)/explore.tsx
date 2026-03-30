import Skeleton from '@/components/Skeleton';
import GooglePlacesService from '@/lib/googlePlacesService';
import WikipediaService from '@/lib/wikipediaService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Destination {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  image: string;
  rating: number;
  description: string;
  featured?: boolean;
}

interface ContinentSection {
  title: string;
  destinations: Destination[];
}

export default function ExploreScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [featuredDestination, setFeaturedDestination] = useState<Destination | null>(null);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const [popularAttractions, setPopularAttractions] = useState<Destination[]>([]);
  const [continentSections, setContinentSections] = useState<ContinentSection[]>([]);

  const getCountryFlag = (countryCode: string) => {
    const flagMap: Record<string, string> = {
      'FR': '🇫🇷',      // France
      'BE': '🇧🇪',      // Belgium  
      'GR': '🇬🇷',      // Greece
      'US': '🇺🇸',      // United States
      'JP': '🇯🇵',      // Japan
      'IT': '🇮🇹',      // Italy
      'ES': '🇪🇸',      // Spain
      'NL': '🇳🇱',      // Netherlands
      'GB': '🇬🇧',      // United Kingdom
      'UK': '🇬🇧',      // United Kingdom
      'TH': '🇹🇭',      // Thailand
      'SG': '🇸🇬',      // Singapore
      'AE': '🇦🇪',      // UAE
      'ZA': '🇿🇦',      // South Africa
      'AU': '🇦🇺',      // Australia
      'IN': '🇮🇳',      // India
      'BR': '🇧🇷',      // Brazil
      'EG': '��',      // Egypt
      'TR': '�🇷',      // Turkey
      'KR': '�🇷',      // South Korea
      'MX': '🇲🇽',      // Mexico
      'PT': '🇵🇹',      // Portugal
      'AT': '🇦🇹',      // Austria
      'CZ': '🇨🇿',      // Czech Republic
      'HU': '🇭🇺',      // Hungary
      'RU': '�🇺',      // Russia
      'SE': '🇸🇪',      // Sweden
      'NO': '🇳🇴',      // Norway
      'FI': '�🇮',      // Finland
      'PL': '🇵🇱',      // Poland
      'DE': '🇩🇪',      // Germany
      'CN': '🇨🇳',      // China
      'ID': '🇮🇩',      // Indonesia
      'PH': '🇵🇭',      // Philippines
      'MY': '🇲🇾',      // Malaysia
      'AR': '��',      // Argentina
      'PE': '🇵🇪'       // Peru
    };
    return flagMap[countryCode] || '🌍';
  };

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      setLoading(true);

      // Fetch real data from APIs - get global destinations
      const popularPlaces = await GooglePlacesService.getPopularDestinations();

      // Convert Google Places data to our Destination format
      const destinations: Destination[] = await Promise.all(
        popularPlaces.slice(0, 30).map(async (place: any, index: number) => {
          // Get Wikipedia info for better description and image
          const [wikiSummary, wikiImage] = await Promise.all([
            WikipediaService.getDestinationSummary(place.name),
            WikipediaService.getDestinationImage(place.name)
          ]);

          // Extract country from formatted address or use fallback
          let country = 'Unknown';
          if (place.formatted_address) {
            const addressParts = place.formatted_address.split(',');
            country = addressParts[addressParts.length - 1].trim();
          } else if (place.name) {
            // Try to extract country from name if available
            country = place.name.split(',').pop()?.trim() || 'Unknown';
          }

          // Get country code (simplified mapping)
          const countryCode = getCountryCode(country);

          return {
            id: place.place_id,
            name: place.name,
            country: country,
            countryCode: countryCode,
            image: place.photos?.[0]
              ? GooglePlacesService.getPhotoUrl(place.photos[0].photo_reference, 400)
              : wikiImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
            rating: place.rating || 4.5,
            description: wikiSummary || `${place.name} - A popular destination in ${country}`,
            featured: index === 0
          };
        })
      );

      // Set featured destination (first one)
      const featured = destinations.find(d => d.featured) || destinations[0];
      setFeaturedDestination(featured);

      // Set popular destinations (first 32)
      setPopularDestinations(destinations.slice(0, 32));

      // Fetch real attractions data
      try {
        const attractionsResponse = await GooglePlacesService.searchPlaces('tourist attractions landmarks monuments worldwide global');
        const attractions: Destination[] = attractionsResponse.slice(0, 8).map((place: any) => ({
          id: place.place_id,
          name: place.name,
          country: place.formatted_address?.split(',').pop()?.trim() || 'Unknown',
          countryCode: getCountryCode(place.formatted_address?.split(',').pop()?.trim() || 'Unknown'),
          image: place.photos?.[0]
            ? GooglePlacesService.getPhotoUrl(place.photos[0].photo_reference, 400)
            : 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
          rating: place.rating || 4.5,
          description: place.formatted_address || `Famous attraction and landmark`
        }));
        setPopularAttractions(attractions);
      } catch (error) {
        console.log('Could not fetch attractions, using destinations as fallback');
        setPopularAttractions(destinations.slice(0, 8));
      }

      // Group destinations by continent
      const continentGroups = groupByContinent(destinations.slice(8));
      setContinentSections(continentGroups);

    } catch (error) {
      console.error('Error fetching explore data:', error);
      // Set empty state when APIs fail - no mock data
      setFeaturedDestination(null);
      setPopularDestinations([]);
      setPopularAttractions([]);
      setContinentSections([]);
    } finally {
      setLoading(false);
    }
  };

  const getCountryCode = (country: string): string => {
    const countryMap: Record<string, string> = {
      'France': 'FR',
      'Belgium': 'BE',
      'Greece': 'GR',
      'United States': 'US',
      'USA': 'US',
      'Japan': 'JP',
      'Italy': 'IT',
      'Spain': 'ES',
      'Netherlands': 'NL',
      'Thailand': 'TH',
      'Singapore': 'SG',
      'United Arab Emirates': 'AE',
      'UAE': 'AE',
      'South Africa': 'ZA',
      'Morocco': 'MA',
      'Argentina': 'AR',
      'Brazil': 'BR',
      'Australia': 'AU',
      'New Zealand': 'NZ',
      'United Kingdom': 'GB',
      'UK': 'GB',
      'Hungary': 'HU',
      'Czech Republic': 'CZ',
      'Philippines': 'PH',
      'India': 'IN',
      'Indonesia': 'ID',
      'Malaysia': 'MY',
      'Portugal': 'PT',
      'Austria': 'AT',
      'Russia': 'RU',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Finland': 'FI',
      'Poland': 'PL',
      'Germany': 'DE',
      'China': 'CN',
      'Turkey': 'TR',
      'South Korea': 'KR',
      'Mexico': 'MX',
      'Egypt': 'EG',
      'Peru': 'PE',
      'Bangalore': 'IN',
      'Manila': 'PH',
      'Budapest': 'HU',
      'Prague': 'CZ',
      'Jakarta': 'ID',
      'Kuala Lumpur': 'MY',
      'Mumbai': 'IN',
      'Istanbul': 'TR',
      'Sydney': 'AU',
      'Cape Town': 'ZA',
      'Cairo': 'EG',
      'Rio de Janeiro': 'BR',
      'Buenos Aires': 'AR',
      'Mexico City': 'MX',
      'Lima': 'PE',
      'Lisbon': 'PT',
      'Vienna': 'AT',
      'Athens': 'GR',
      'Moscow': 'RU',
      'Madrid': 'ES',
      'Berlin': 'DE',
      'Beijing': 'CN',
      'Bangkok': 'TH',
      'Dubai': 'AE',
      'Seoul': 'KR'
    };
    return countryMap[country] || '🌍';
  };

  const groupByContinent = (destinations: Destination[]): ContinentSection[] => {
    const continentMap: Record<string, string[]> = {
      'Europe': ['France', 'Belgium', 'Greece', 'Italy', 'Spain', 'Netherlands', 'United Kingdom', 'UK'],
    };

    const groups: Record<string, Destination[]> = {};

    destinations.forEach((destination: Destination) => {
      for (const [continent, countries] of Object.entries(continentMap)) {
        if (countries.includes(destination.country)) {
          if (!groups[continent]) {
            groups[continent] = [];
          };
          groups[continent].push(destination);
          break;
        }
      }
    });

    return Object.entries(groups).map(([continent, destinationList]) => ({
      title: continent,
      destinations: destinationList
    }));
  };

  const handleDestinationPress = (destination: Destination) => {
    router.push('/discover/[destinationId]?name=' + encodeURIComponent(destination.name) +
      '&country=' + encodeURIComponent(destination.country) +
      '&countryCode=' + destination.countryCode as any);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
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
                  <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
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
                      <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
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
                      <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
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
    <SafeAreaView className="flex-1 bg-white">
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
                <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
                  <Image
                    source={{ uri: destination.image }}
                    className="w-full h-24"
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <Text className="font-semibold text-gray-800 text-sm">{destination.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-lg mr-1">{getCountryFlag(destination.countryCode)}</Text>
                      <Text className="text-gray-600 text-xs">{destination.country}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text className="text-gray-600 text-xs ml-1">{destination.rating}</Text>
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
                  <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">{destination.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">{getCountryFlag(destination.countryCode)}</Text>
                        <Text className="text-gray-600 text-xs">{destination.country}</Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">{destination.rating}</Text>
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
                  <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">{destination.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">{getCountryFlag(destination.countryCode)}</Text>
                        <Text className="text-gray-600 text-xs">{destination.country}</Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">{destination.rating}</Text>
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
                  <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">{destination.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">{getCountryFlag(destination.countryCode)}</Text>
                        <Text className="text-gray-600 text-xs">{destination.country}</Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">{destination.rating}</Text>
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
                  <View className="bg-white rounded-xl shadow-md overflow-hidden w-40">
                    <Image
                      source={{ uri: destination.image }}
                      className="w-full h-24"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="font-semibold text-gray-800 text-sm">{destination.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-lg mr-1">{getCountryFlag(destination.countryCode)}</Text>
                        <Text className="text-gray-600 text-xs">{destination.country}</Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text className="text-gray-600 text-xs ml-1">{destination.rating}</Text>
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
