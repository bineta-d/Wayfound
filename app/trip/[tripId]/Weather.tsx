import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

interface WeatherData {
  day: number;
  date: string;
  temp: number;
  description: string;
  icon: string;
}

interface WeatherProps {
  destination: string;
  startDate: string;
  endDate: string;
}

export default function Weather({ destination, startDate, endDate }: WeatherProps) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, [destination, startDate, endDate]);

  const fetchWeatherData = async () => {
    try {
      console.log('🌤️ Starting weather fetch for:', { destination, startDate, endDate });

      const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
      if (!API_KEY) {
        console.error('❌ OpenWeather API key not found in environment variables');
        setError('Weather API key not configured');
        setLoading(false);
        return;
      }

      // Calculate number of days between start and end dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      console.log('📅 Trip duration:', daysDiff, 'days');

      // Get coordinates for the destination
      const geoResponse = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${API_KEY}`
      );
      const geoData = await geoResponse.json();

      if (geoData.length === 0) {
        console.error('❌ Location not found:', destination);
        setError('Location not found');
        setLoading(false);
        return;
      }

      const { lat, lon } = geoData[0];
      console.log('📍 Location coordinates:', { lat, lon, name: geoData[0].name });

      // Fetch weather forecast for each day
      const weatherPromises = [];
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        const weatherPromise = fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        ).then(res => res.json());

        weatherPromises.push(weatherPromise);
      }

      const weatherResults = await Promise.all(weatherPromises);
      console.log('🌤️ Raw weather data received:', weatherResults);

      const formattedWeather: WeatherData[] = weatherResults.map((weather, index) => {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + index);

        const weatherInfo = {
          day: index + 1,
          date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          temp: Math.round(weather.main.temp),
          description: weather.weather[0].main.toLowerCase(),
          icon: weather.weather[0].icon
        };

        console.log(`📊 Day ${index + 1} weather:`, weatherInfo);
        return weatherInfo;
      });

      console.log('✅ Final weather data:', formattedWeather);
      setWeatherData(formattedWeather);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching weather data:', err);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const getWeatherIcon = (description: string, icon: string) => {
    // Map OpenWeather icons to Ionicons
    if (icon.includes('01')) return 'sunny'; // clear sky
    if (icon.includes('02')) return 'partly-sunny'; // few clouds
    if (icon.includes('03') || icon.includes('04')) return 'cloudy'; // scattered/broken clouds
    if (icon.includes('09') || icon.includes('10')) return 'rainy'; // shower rain/rain
    if (icon.includes('11')) return 'thunderstorm'; // thunderstorm
    if (icon.includes('13')) return 'snowy'; // snow
    if (icon.includes('50')) return 'foggy'; // mist

    // Fallback to description
    if (description.includes('clear')) return 'sunny';
    if (description.includes('cloud')) return 'cloudy';
    if (description.includes('rain')) return 'rainy';
    if (description.includes('snow')) return 'snowy';

    return 'partly-sunny'; // default
  };

  const getWeatherDescription = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear')) return 'Sunny';
    if (desc.includes('cloud')) {
      if (desc.includes('few') || desc.includes('partly')) return 'Partly Cloudy';
      return 'Cloudy';
    }
    if (desc.includes('rain')) return 'Rainy';
    if (desc.includes('snow')) return 'Snowy';
    if (desc.includes('thunderstorm')) return 'Stormy';
    if (desc.includes('mist') || desc.includes('fog')) return 'Foggy';
    return 'Clear';
  };

  if (loading) {
    return (
      <View className="bg-white px-6 py-4 mb-4">
        <View className="flex-row justify-center items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="ml-2 text-gray-600">Loading weather...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-white px-6 py-4 mb-4">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  if (weatherData.length === 0) {
    return null;
  }

  return (
    <View className="bg-white px-6 py-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-3">Weather Forecast</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {weatherData.map((weather, index) => {
          const iconName = getWeatherIcon(weather.description, weather.icon);
          const description = getWeatherDescription(weather.description);

          return (
            <View
              key={index}
              className="bg-blue-50 rounded-lg p-4 mr-3 min-w-[100px] items-center border border-blue-100"
            >
              <Text className="text-sm font-semibold text-gray-700 mb-1">Day {weather.day}</Text>
              <Text className="text-xs text-gray-500 mb-2">{weather.date}</Text>

              <View className="bg-blue-100 rounded-full p-3 mb-2">
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color="#3B82F6"
                />
              </View>

              <Text className="text-sm font-medium text-gray-800 mb-1">{description}</Text>
              <Text className="text-xs text-gray-600">{weather.temp}°C</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
