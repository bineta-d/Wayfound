import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

interface WeatherDetailProps {
  day: number;
  date: string;
  temp: number;
  description: string;
  icon: string;
  location: string;
  hourlyData?: Array<{
    time: string;
    temp: number;
    icon: string;
  }>;
  rainChance?: number;
  windSpeed?: number;
  humidity?: number;
  feelsLike?: number;
}

export default function WeatherDetail() {
  const { day, date } = useLocalSearchParams();
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherDetailProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeatherDetail();
  }, [day, date]);

  const fetchWeatherDetail = async () => {
    try {
      console.log(`🌤️ Fetching weather detail for day ${day}, date ${date}`);

      // For demo purposes, create detailed weather data
      // In real implementation, this would fetch from OpenWeather API with more detailed data
      const mockDetailData: WeatherDetailProps = {
        day: parseInt(day as string),
        date: date as string,
        temp: 72, // Fahrenheit
        description: 'Partly Cloudy',
        icon: 'partly-sunny',
        location: 'Nice, France',
        hourlyData: [
          { time: '12:00 AM', temp: 65, icon: 'moon' },
          { time: '3:00 AM', temp: 66, icon: 'moon' },
          { time: '6:00 AM', temp: 68, icon: 'partly-sunny' },
          { time: '9:00 AM', temp: 71, icon: 'partly-sunny' },
          { time: '12:00 PM', temp: 75, icon: 'partly-sunny' },
          { time: '3:00 PM', temp: 74, icon: 'cloudy' },
          { time: '6:00 PM', temp: 73, icon: 'cloudy' },
          { time: '9:00 PM', temp: 71, icon: 'cloudy' },
          { time: '12:00 AM', temp: 70, icon: 'cloudy' },
        ],
        rainChance: 25,
        windSpeed: 8,
        humidity: 65,
        feelsLike: 70
      };

      console.log('📊 Weather detail data:', mockDetailData);
      setWeatherData(mockDetailData);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching weather detail:', err);
      setLoading(false);
    }
  };

  const getWeatherIconColor = (description: string, icon: string) => {
    if (icon.includes('01') || description.includes('clear')) return '#FCD34D';
    return '#3B82F6';
  };

  const celsiusToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9 / 5) + 32);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading weather details...</Text>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-red-500 text-center">Failed to load weather details</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header - Title Only */}
      <View className="bg-blue-500 px-6 py-4">
        <Text className="text-white text-lg font-semibold text-center">Day {weatherData.day} Weather</Text>
      </View>

      {/* Location and Main Weather */}
      <View className="px-6 py-6">
        <Text className="text-gray-600 text-center mb-2">{weatherData.location}</Text>

        <View className="items-center mb-6">
          <View className="bg-blue-100 rounded-full p-6 mb-4">
            <Ionicons
              name={weatherData.icon as any}
              size={64}
              color={getWeatherIconColor(weatherData.description, weatherData.icon)}
            />
          </View>
          <Text className="text-3xl font-bold text-gray-800">{weatherData.temp}°F</Text>
          <Text className="text-lg text-gray-600">{weatherData.description}</Text>
        </View>

        {/* Weather Metrics */}
        <View className="bg-gray-50 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Weather Details</Text>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Feels Like</Text>
              <Text className="font-semibold text-gray-800">{weatherData.feelsLike}°F</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Rain Chance</Text>
              <Text className="font-semibold text-blue-600">{weatherData.rainChance}%</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Wind Speed</Text>
              <Text className="font-semibold text-gray-800">{weatherData.windSpeed} mph</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Humidity</Text>
              <Text className="font-semibold text-gray-800">{weatherData.humidity}%</Text>
            </View>
          </View>
        </View>

        {/* Temperature Timeline */}
        <View className="bg-gray-50 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Temperature Timeline</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {weatherData.hourlyData?.map((hour, index) => (
              <View key={index} className="bg-white rounded-lg p-3 mr-3 min-w-[80px] items-center">
                <Text className="text-gray-600 text-xs font-medium mb-2">{hour.time}</Text>
                <View className="bg-blue-100 rounded-full p-2 mb-2">
                  <Ionicons
                    name={hour.icon as any}
                    size={16}
                    color={getWeatherIconColor('', hour.icon)}
                  />
                </View>
                <Text className="font-semibold text-gray-800 text-sm">{hour.temp}°F</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}
