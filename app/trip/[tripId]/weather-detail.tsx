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

          {/* Temperature Graph */}
          <View className="bg-white rounded-lg p-4 mb-4">
            <View className="h-32 relative">
              {/* Temperature Line Graph */}
              <View className="absolute inset-0">
                {(() => {
                  const temps = weatherData.hourlyData?.map(h => h.temp) || [];
                  const minTemp = Math.min(...temps);
                  const maxTemp = Math.max(...temps);
                  const tempRange = maxTemp - minTemp || 1;

                  return (
                    <View className="relative h-full">
                      {/* Create curved line with segments */}
                      <View className="absolute inset-0">
                        {weatherData.hourlyData?.map((hour, index) => {
                          if (index === 0) return null;

                          const prevHour = weatherData.hourlyData[index - 1];
                          const prevTempPosition = ((prevHour.temp - minTemp) / tempRange) * 80;
                          const currTempPosition = ((hour.temp - minTemp) / tempRange) * 80;

                          const prevLeft = 10 + ((index - 1) * 10);
                          const currLeft = 10 + (index * 10);

                          // Calculate control points for curve
                          const midLeft = (prevLeft + currLeft) / 2;
                          const midTop = 50 + ((prevTempPosition + currTempPosition) / 2) - 40; // Adjust for centering

                          return (
                            <View key={index} className="absolute">
                              {/* Create curve approximation with multiple small segments */}
                              <View
                                className="absolute bg-green-500"
                                style={{
                                  left: `${prevLeft}%`,
                                  top: `${50 + prevTempPosition - 40}%`,
                                  width: `${currLeft - prevLeft}%`,
                                  height: 2,
                                  backgroundColor: '#10B981',
                                  transform: [
                                    { rotate: `${Math.atan2((currTempPosition - prevTempPosition) * 0.8, (currLeft - prevLeft) * 0.8) * 180 / Math.PI}deg` },
                                    { translateX: 0 },
                                    { translateY: -1 }
                                  ]
                                }}
                              />
                            </View>
                          );
                        })}
                      </View>

                      {/* Temperature points */}
                      {weatherData.hourlyData?.map((hour, index) => {
                        const tempPosition = ((hour.temp - minTemp) / tempRange) * 80; // 80% of height
                        const isMax = hour.temp === maxTemp;
                        const isMin = hour.temp === minTemp;
                        const pointColor = isMax ? '#EF4444' : isMin ? '#3B82F6' : '#10B981';

                        return (
                          <View
                            key={index}
                            className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm"
                            style={{
                              backgroundColor: pointColor,
                              left: `${10 + (index * 10)}%`,
                              bottom: `${10 + tempPosition}%`,
                              transform: [{ translateX: -6 }, { translateY: 6 }],
                              zIndex: 10
                            }}
                          />
                        );
                      })}
                    </View>
                  );
                })()}
              </View>

              {/* Time labels below graph */}
              <View className="absolute bottom-0 left-0 right-0 flex-row justify-between px-2">
                {weatherData.hourlyData?.map((hour, index) => (
                  <Text
                    key={index}
                    className="text-xs text-gray-500"
                    style={{ width: '10%', textAlign: 'center' }}
                  >
                    {hour.time.split(':')[0]}
                  </Text>
                ))}
              </View>
            </View>
          </View>

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
