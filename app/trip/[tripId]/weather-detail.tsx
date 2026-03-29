import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
const { fetchWeatherApi } = require('openmeteo');

interface WeatherDetailProps {
  day: number;
  date: string;
  temp: number;
  description: string;
  icon: string;
  location: string;
  destination: string;
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
  const { day, date, temp, description, icon, destination } = useLocalSearchParams();
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherDetailProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeatherDetail();
  }, [day, date, temp, description, icon, destination]);

  const fetchWeatherDetail = async () => {
    try {
      console.log('🌤️ Fetching weather detail with params:', {
        day, date, temp, description, icon, destination
      });

      // Parse the passed parameters
      const weatherInfo = {
        day: parseInt(day as string),
        date: date as string,
        temp: parseFloat(temp as string),
        description: description as string,
        icon: icon as string,
        destination: destination as string,
      };

      console.log('📊 Base weather info from card:', weatherInfo);

      // Get coordinates for the destination using Open-Meteo geocoding
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherInfo.destination)}&count=1&language=en`;
      const geocodingResponse = await fetch(geocodingUrl);
      const geocodingData = await geocodingResponse.json();

      if (!geocodingData.results || geocodingData.results.length === 0) {
        throw new Error('Location not found');
      }

      const { latitude, longitude } = geocodingData.results[0];
      console.log('📍 Location coordinates:', { latitude, longitude, location: weatherInfo.destination });

      // Calculate the specific date for this day using current date + offset
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() + (weatherInfo.day - 1));

      console.log('📅 Target date for weather detail:', targetDate.toISOString());

      // Check if target date is within 16 days (Open-Meteo forecast limit)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      const daysDifference = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference > 16 || daysDifference < 0) {
        console.log(`⚠️ Target date ${daysDifference} days away, showing pending status`);
        // Show pending status for dates outside forecast range
        const detailData: WeatherDetailProps = {
          day: weatherInfo.day,
          date: weatherInfo.date,
          temp: 0,
          description: daysDifference < 0 ? 'no data' : 'data pending',
          icon: daysDifference < 0 ? 'help' : 'time',
          location: weatherInfo.destination,
          destination: weatherInfo.destination,
          hourlyData: [],
          rainChance: 0,
          windSpeed: 0,
          humidity: 0,
          feelsLike: 0,
        };

        console.log('✅ Final weather detail data (pending):', detailData);
        setWeatherData(detailData);
        setLoading(false);
        return;
      }

      // Prepare weather variables for Open-Meteo
      const weatherParams = {
        latitude,
        longitude,
        hourly: [
          "temperature_2m",
          "relativehumidity_2m",
          "precipitation_probability",
          "weathercode",
          "windspeed_10m",
          "apparent_temperature"
        ],
        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "weathercode",
          "precipitation_probability_max"
        ],
        forecast_days: Math.min(16, daysDifference + 1), // Extended forecast up to 16 days
        timezone: "auto"
      };

      console.log('🔍 Fetching weather detail with params:', weatherParams);

      // Fetch weather data from Open-Meteo
      const responses = await fetchWeatherApi("https://api.open-meteo.com/v1/forecast", weatherParams);
      const response = responses[0];

      // Process the response
      const utcOffsetSeconds = response.utcOffsetSeconds();
      const daily = response.daily()!;
      const hourly = response.hourly()!;

      console.log('📊 Raw Open-Meteo detail response processed');

      // Convert weather codes to descriptions
      const getWeatherDescription = (code: number) => {
        const weatherCodes: Record<number, string> = {
          0: "clear sky",
          1: "mainly clear",
          2: "partly cloudy",
          3: "overcast",
          45: "fog",
          48: "fog",
          51: "light drizzle",
          53: "drizzle",
          55: "dense drizzle",
          56: "light freezing drizzle",
          57: "freezing drizzle",
          61: "light rain",
          63: "rain",
          65: "heavy rain",
          66: "light freezing rain",
          67: "freezing rain",
          71: "light snow",
          73: "snow",
          75: "heavy snow",
          77: "snow grains",
          80: "light showers",
          81: "showers",
          82: "heavy showers",
          85: "light snow showers",
          86: "snow showers",
          95: "thunderstorm",
          96: "thunderstorm",
          99: "severe thunderstorm"
        };
        return weatherCodes[code] || "unknown";
      };

      // Convert weather codes to icons
      const getWeatherIcon = (code: number, isDay: boolean = true) => {
        const iconMap: Record<number, { day: string; night: string }> = {
          0: { day: "sunny", night: "moon" },
          1: { day: "partly-sunny", night: "cloud" },
          2: { day: "partly-sunny", night: "cloud" },
          3: { day: "cloud", night: "cloud" },
          45: { day: "cloudy-outline", night: "cloudy-outline" },
          48: { day: "cloudy-outline", night: "cloudy-outline" },
          51: { day: "rainy-outline", night: "rainy-outline" },
          53: { day: "rainy", night: "rainy" },
          55: { day: "rainy", night: "rainy" },
          56: { day: "snow", night: "snow" },
          57: { day: "snow", night: "snow" },
          61: { day: "rainy-outline", night: "rainy-outline" },
          63: { day: "rainy", night: "rainy" },
          65: { day: "rainy", night: "rainy" },
          66: { day: "snow", night: "snow" },
          67: { day: "snow", night: "snow" },
          71: { day: "snow", night: "snow" },
          73: { day: "snow", night: "snow" },
          75: { day: "snow", night: "snow" },
          77: { day: "snow", night: "snow" },
          80: { day: "rainy-outline", night: "rainy-outline" },
          81: { day: "rainy", night: "rainy" },
          82: { day: "rainy", night: "rainy" },
          85: { day: "snow", night: "snow" },
          86: { day: "snow", night: "snow" },
          95: { day: "thunderstorm", night: "thunderstorm" },
          96: { day: "thunderstorm", night: "thunderstorm" },
          99: { day: "thunderstorm", night: "thunderstorm" }
        };
        const iconData = iconMap[code];
        return iconData ? (isDay ? iconData.day : iconData.night) : "help";
      };

      // Get daily data
      const dailyMaxTemp = daily.variables(0)!.valuesArray()!;
      const dailyMinTemp = daily.variables(1)!.valuesArray()!;
      const dailyWeatherCode = daily.variables(2)!.valuesArray()!;

      const maxTemp = dailyMaxTemp[0];
      const minTemp = dailyMinTemp[0];
      const avgTemp = (maxTemp + minTemp) / 2;
      const weatherCode = dailyWeatherCode[0];

      // Get hourly data
      const hourlyTime = Array.from(
        { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
      );

      const hourlyTemp = hourly.variables(0)!.valuesArray()!;
      const hourlyHumidity = hourly.variables(1)!.valuesArray()!;
      const hourlyPrecipProb = hourly.variables(2)!.valuesArray()!;
      const hourlyWeatherCode = hourly.variables(3)!.valuesArray()!;
      const hourlyWindSpeed = hourly.variables(4)!.valuesArray()!;
      const hourlyFeelsLike = hourly.variables(5)!.valuesArray()!;

      // Process hourly data - ensure proper chronological order
      const hourlyData = [];
      for (let i = 0; i < hourlyTime.length; i += 3) { // Every 3 hours
        const time = hourlyTime[i];
        hourlyData.push({
          time: time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
            minute: '2-digit'
          }),
          temp: Math.round(celsiusToFahrenheit(hourlyTemp[i])),
          icon: getWeatherIcon(hourlyWeatherCode[i], time.getHours() >= 6 && time.getHours() < 18)
        });
      }

      // Calculate rain chance (average precipitation probability)
      const rainChance = Math.round(Array.from(hourlyPrecipProb).reduce((sum, prob) => sum + prob, 0) / hourlyPrecipProb.length);

      // Calculate wind speed (average) - convert from km/h to mph
      const windSpeedKmh = Math.round(Array.from(hourlyWindSpeed).reduce((sum, speed) => sum + speed, 0) / hourlyWindSpeed.length);
      const windSpeed = Math.round(windSpeedKmh * 0.621371); // Convert km/h to mph

      // Calculate humidity (average)
      const humidity = Math.round(Array.from(hourlyHumidity).reduce((sum, hum) => sum + hum, 0) / hourlyHumidity.length);

      // Calculate feels like (average)
      const feelsLike = Math.round(Array.from(hourlyFeelsLike).reduce((sum, feel) => sum + feel, 0) / hourlyFeelsLike.length);

      const detailData: WeatherDetailProps = {
        day: weatherInfo.day,
        date: weatherInfo.date,
        temp: Math.round(celsiusToFahrenheit(avgTemp)),
        description: getWeatherDescription(weatherCode),
        icon: getWeatherIcon(weatherCode, true),
        location: weatherInfo.destination,
        destination: weatherInfo.destination,
        hourlyData: hourlyData,
        rainChance: rainChance,
        windSpeed: windSpeed,
        humidity: humidity,
        feelsLike: Math.round(celsiusToFahrenheit(feelsLike)),
      };

      console.log('✅ Final weather detail data:', detailData);
      setWeatherData(detailData);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching weather detail:', err);
      setLoading(false);
    }
  };

  const celsiusToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9 / 5) + 32);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Loading Weather...',
          }}
        />
        <View className="flex-1 bg-white justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading weather details...</Text>
        </View>
      </>
    );
  }

  if (!weatherData) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Weather Error',
          }}
        />
        <View className="flex-1 bg-white justify-center items-center">
          <Text className="text-red-500 text-center">Failed to load weather details</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Day ${weatherData?.day || ''} Weather`,
        }}
      />
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
                color={weatherData.description.includes('clear') ? '#FCD34D' : '#3B82F6'}
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
                      color={hour.icon.includes('sunny') ? '#FCD34D' : '#3B82F6'}
                    />
                  </View>
                  <Text className="font-semibold text-gray-800 text-sm">{hour.temp}°F</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
