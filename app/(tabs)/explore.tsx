import GooglePlacesService from '@/lib/googlePlacesService';
import WikipediaService from '@/lib/wikipediaService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
      'FR': '🇫🇷',
      'BE': '🇧🇪',
      'GR': '🇬🇷',
      'US': '🇺🇸',
      'JP': '🇯🇵',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'NL': '🇳🇱',
      'TH': '🇹🇭',
      'SG': '🇸🇬',
      'AE': '🇦🇪',
      'ZA': '🇿🇦',
      'MA': '🇲🇦',
      'AR': '🇦🇷',
      'BR': '🇧🇷',
      'AU': '🇦🇺',
      'NZ': '🇳🇿',
      'GB': '🇬🇧',
    };
    return flagMap[countryCode] || '🌍';
  };

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      setLoading(true);

      // Fetch real data from APIs
      const popularPlaces = await GooglePlacesService.getPopularDestinations();

      // Convert Google Places data to our Destination format
      const destinations: Destination[] = await Promise.all(
        popularPlaces.slice(0, 20).map(async (place: any, index: number) => {
          // Get Wikipedia info for better description and image
          const wikiInfo = await WikipediaService.getDestinationInfo(place.name);

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
              ? GooglePlacesService.getPhotoUrl(place.photos[0].photo_reference)
              : wikiInfo.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
            rating: place.rating || 4.5,
            description: wikiInfo.summary || `${place.name} - A popular destination in ${country}`,
            featured: index === 0
          };
        })
      );

      // Set featured destination (first one)
      const featured = destinations.find(d => d.featured) || destinations[0];
      setFeaturedDestination(featured);

      // Set popular destinations (first 8)
      setPopularDestinations(destinations.slice(0, 8));

      // Fetch real attractions data
      try {
        const attractionsResponse = await GooglePlacesService.searchPlaces('tourist attractions landmarks monuments');
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
      // Set fallback data when APIs fail
      const fallbackFeatured: Destination = {
        id: '1',
        name: 'Eiffel Tower',
        country: 'France',
        countryCode: 'FR',
        image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
        rating: 4.8,
        description: 'Iconic iron lattice tower and symbol of Paris',
        featured: true
      };

      const fallbackAttractions: Destination[] = [
        {
          id: 'attr1',
          name: 'Christ the Redeemer',
          country: 'Brazil',
          countryCode: 'BR',
          image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
          rating: 4.9,
          description: 'Iconic statue overlooking Rio de Janeiro'
        },
        {
          id: 'attr2',
          name: 'Colosseum',
          country: 'Italy',
          countryCode: 'IT',
          image: 'https://images.unsplash.com/photo-1554866565-c0b5c0fb08b7?w=400',
          rating: 4.8,
          description: 'Ancient Roman amphitheater in Rome'
        },
        {
          id: 'attr3',
          name: 'Machu Picchu',
          country: 'Peru',
          countryCode: 'PE',
          image: 'https://images.unsplash.com/photo-1526392060635-9d6019884bc7?w=400',
          rating: 4.9,
          description: 'Ancient Incan citadel in the Andes'
        },
        {
          id: 'attr4',
          name: 'Taj Mahal',
          country: 'India',
          countryCode: 'IN',
          image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400',
          rating: 4.9,
          description: 'Mausoleum of love in Agra'
        },
        {
          id: 'attr5',
          name: 'Great Wall of China',
          country: 'China',
          countryCode: 'CN',
          image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
          rating: 4.9,
          description: 'Ancient fortification stretching across China'
        }
      ];

      const fallbackDestinations: Destination[] = [
        {
          id: '2',
          name: 'London',
          country: 'United Kingdom',
          countryCode: 'GB',
          image: 'https://images.unsplash.com/photo-1512053194496-24c0e77ef8ca?w=400',
          rating: 4.7,
          description: 'Historic capital with royal palaces and modern culture.'
        },
        {
          id: '3',
          name: 'Tokyo',
          country: 'Japan',
          countryCode: 'JP',
          image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
          rating: 4.9,
          description: 'Ultra-modern metropolis blending tradition and innovation.'
        }
      ];

      setFeaturedDestination(fallbackFeatured);
      setPopularDestinations(fallbackDestinations);
      setPopularAttractions(fallbackAttractions);
      setContinentSections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMockData = () => {
    // Fallback mock data
    const mockFeatured: Destination = {
      id: '1',
      name: 'Paris',
      country: 'France',
      countryCode: 'FR',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800',
      rating: 4.8,
      description: 'The City of Light awaits with iconic landmarks and romantic ambiance.',
      featured: true
    };

    const mockPopular: Destination[] = [
      {
        id: '2',
        name: 'Brussels',
        country: 'Belgium',
        countryCode: 'BE',
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        rating: 4.6,
        description: 'Heart of Europe with stunning architecture and delicious chocolate.'
      },
      {
        id: '3',
        name: 'Thessaloniki',
        country: 'Greece',
        countryCode: 'GR',
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        rating: 4.5,
        description: 'Historic port city with Byzantine treasures and vibrant culture.'
      },
      {
        id: '4',
        name: 'Miami',
        country: 'USA',
        countryCode: 'US',
        image: 'https://images.unsplash.com/photo-1514214246233-66a89430dbfe?w=400',
        rating: 4.7,
        description: 'Sun-soaked beaches and Art Deco glamour in South Florida.'
      },
      {
        id: '5',
        name: 'Tokyo',
        country: 'Japan',
        countryCode: 'JP',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
        rating: 4.9,
        description: 'Ultra-modern metropolis blending tradition and innovation.'
      }
    ];

    // Mock popular attractions data
    const mockPopularAttractions: Destination[] = [
      {
        id: 'attr1',
        name: 'Christ the Redeemer',
        country: 'Brazil',
        countryCode: 'BR',
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        rating: 4.9,
        description: 'Iconic statue overlooking Rio de Janeiro'
      },
      {
        id: 'attr2',
        name: 'Royal Gallery Saint Hubert',
        country: 'Belgium',
        countryCode: 'BE',
        image: 'https://images.unsplash.com/photo-1513569328165-a76d6579ee93?w=400',
        rating: 4.7,
        description: 'Historic shopping gallery in Brussels'
      },
      {
        id: 'attr3',
        name: 'Monument de la Renaissance Africaine',
        country: 'Senegal',
        countryCode: 'SN',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b3?w=400',
        rating: 4.6,
        description: 'Monumental statue in Dakar'
      },
      {
        id: 'attr4',
        name: 'Machu Picchu',
        country: 'Peru',
        countryCode: 'PE',
        image: 'https://images.unsplash.com/photo-1526392060635-9d6019884bc7?w=400',
        rating: 4.9,
        description: 'Ancient Incan citadel in the Andes'
      },
      {
        id: 'attr5',
        name: 'Eiffel Tower',
        country: 'France',
        countryCode: 'FR',
        image: 'https://images.unsplash.com/photo-1511739001486-5ea265f8dd2f?w=400',
        rating: 4.8,
        description: 'Iconic iron tower in Paris'
      },
      {
        id: 'attr6',
        name: 'Taj Mahal',
        country: 'India',
        countryCode: 'IN',
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400',
        rating: 4.9,
        description: 'Mausoleum of love in Agra'
      },
      {
        id: 'attr7',
        name: 'Colosseum',
        country: 'Italy',
        countryCode: 'IT',
        image: 'https://images.unsplash.com/photo-1554866565-c0b5c0fb08b7?w=400',
        rating: 4.8,
        description: 'Ancient Roman amphitheater'
      },
      {
        id: 'attr8',
        name: 'Great Wall of China',
        country: 'China',
        countryCode: 'CN',
        image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
        rating: 4.9,
        description: 'Ancient fortification stretching across China'
      }
    ];

    const mockContinentSections: ContinentSection[] = [
      {
        title: 'Europe',
        destinations: [
          { id: '6', name: 'Rome', country: 'Italy', countryCode: 'IT', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b3?w=400', rating: 4.8, description: 'Eternal city with ancient history' },
          { id: '7', name: 'Barcelona', country: 'Spain', countryCode: 'ES', image: 'https://images.unsplash.com/photo-1513569328165-a76d6579ee93?w=400', rating: 4.7, description: 'Vibrant Catalan capital' },
          { id: '8', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', image: 'https://images.unsplash.com/photo-1555854877-b70a8dd66ec2?w=400', rating: 4.6, description: 'Picturesque canal city' }
        ]
      },
      {
        title: 'Asia',
        destinations: [
          { id: '9', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', rating: 4.7, description: 'Vibrant street life and temples' },
          { id: '10', name: 'Singapore', country: 'Singapore', countryCode: 'SG', image: 'https://images.unsplash.com/photo-1529655683826-aba9b3a77d83?w=400', rating: 4.8, description: 'Modern city-state' },
          { id: '11', name: 'Dubai', country: 'UAE', countryCode: 'AE', image: 'https://images.unsplash.com/photo-1512453979798-5ea265f8dd2f?w=400', rating: 4.6, description: 'Futuristic skyline' }
        ]
      }
    ];

    setFeaturedDestination(mockFeatured);
    setPopularDestinations(mockPopular);
    setPopularAttractions(mockPopularAttractions);
    setContinentSections(mockContinentSections);
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
      'UK': 'GB'
    };
    return countryMap[country] || '🌍';
  };

  const groupByContinent = (destinations: Destination[]): ContinentSection[] => {
    const continentMap: Record<string, string[]> = {
      'Europe': ['France', 'Belgium', 'Greece', 'Italy', 'Spain', 'Netherlands', 'United Kingdom', 'UK'],
      'Asia': ['Japan', 'Thailand', 'Singapore', 'United Arab Emirates', 'UAE'],
      'Africa': ['South Africa', 'Morocco'],
      'South America': ['Argentina', 'Brazil'],
      'Oceania': ['Australia', 'New Zealand'],
      'North America': ['United States', 'USA', 'Canada', 'Mexico']
    };

    const groups: Record<string, Destination[]> = {};

    destinations.forEach(destination => {
      for (const [continent, countries] of Object.entries(continentMap)) {
        if (countries.includes(destination.country)) {
          if (!groups[continent]) {
            groups[continent] = [];
          }
          groups[continent].push(destination);
          break;
        }
      }
    });

    return Object.entries(groups).map(([title, destinations]) => ({
      title,
      destinations: destinations.slice(0, 3) // Limit to 3 per continent
    }));
  };

  const handleDestinationPress = (destination: Destination) => {
    router.push('/discover/[destinationId]?name=' + encodeURIComponent(destination.name) +
      '&country=' + encodeURIComponent(destination.country) +
      '&countryCode=' + destination.countryCode as any);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600">Loading destinations...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
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
            {popularDestinations.slice(0, 6).map((destination) => (
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
            {popularDestinations.slice(6, 12).map((destination) => (
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
      </View>

      {/* Continent Sections */}
      {continentSections.map((continent, index) => (
        <View key={index} className="mb-6">
          <Text className="text-xl font-bold px-6 mb-4">{continent.title}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
          >
            {continent.destinations.map((destination) => (
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
      ))}


    </ScrollView>
  );
}
