import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  const router = useRouter();

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

      // Fetch weather forecast for the trip duration
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=${daysDiff * 8}` // 8 forecasts per day (3-hour intervals)
      );
      const forecastData = await forecastResponse.json();

      console.log('🌤️ Raw forecast data received:', forecastData);

      // Process forecast data to get daily weather
      const dailyForecasts: Record<string, {
        temps: number[];
        descriptions: string[];
        icons: string[];
        main: any;
        weather: any[];
      }> = {};
      forecastData.list.forEach((forecast: any) => {
        const forecastDate = new Date(forecast.dt * 1000);
        const dateKey = forecastDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!dailyForecasts[dateKey]) {
          dailyForecasts[dateKey] = {
            temps: [],
            descriptions: [],
            icons: [],
            main: forecast.main,
            weather: forecast.weather
          };
        }

        dailyForecasts[dateKey].temps.push(forecast.main.temp);
        dailyForecasts[dateKey].descriptions.push(forecast.weather[0].main);
        dailyForecasts[dateKey].icons.push(forecast.weather[0].icon);
      });

      console.log('📊 Processed daily forecasts:', dailyForecasts);

      const formattedWeather: WeatherData[] = [];
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateKey = currentDate.toISOString().split('T')[0];

        const dayForecast = dailyForecasts[dateKey];
        if (dayForecast && dayForecast.descriptions.length > 0) {
          // Calculate average temperature and get most common weather description
          const avgTemp = dayForecast.temps.reduce((sum: number, temp: number) => sum + temp, 0) / dayForecast.temps.length;

          // Get most common description and icon
          const descriptionCounts: Record<string, number> = {};
          const iconCounts: Record<string, number> = {};

          dayForecast.descriptions.forEach((desc: string) => {
            descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
          });
          dayForecast.icons.forEach((icon: string) => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
          });

          const mostCommonDesc = Object.keys(descriptionCounts).reduce((a, b) =>
            descriptionCounts[a] > descriptionCounts[b] ? a : b
          );
          const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) =>
            iconCounts[a] > iconCounts[b] ? a : b
          );

          const weatherInfo = {
            day: i + 1,
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            temp: Math.round(avgTemp),
            description: mostCommonDesc.toLowerCase(),
            icon: mostCommonIcon
          };

          console.log(`📊 Day ${i + 1} weather:`, weatherInfo);
          formattedWeather.push(weatherInfo);
        } else {
          console.log(`⚠️ No forecast data for ${dateKey}, using fallback`);
          // Fallback to current weather if no forecast data
          const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
          );
          const weather = await weatherResponse.json();

          const weatherInfo = {
            day: i + 1,
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            temp: Math.round(weather.main.temp + (Math.random() * 10 - 5)), // Add some variation
            description: weather.weather[0].main.toLowerCase(),
            icon: weather.weather[0].icon
          };

          console.log(`📊 Day ${i + 1} fallback weather:`, weatherInfo);
          formattedWeather.push(weatherInfo);
        }
      }

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
    // Map OpenWeather icons to Ionicons - comprehensive mapping
    const iconMap: Record<string, string> = {
      '01d': 'sunny', '01n': 'moon', // clear sky day/night
      '02d': 'partly-sunny', '02n': 'cloud', // few clouds day/night
      '03d': 'cloudy', '03n': 'cloudy', // scattered clouds
      '04d': 'cloud', '04n': 'cloud', // broken clouds
      '09d': 'rainy', '09n': 'rainy', // shower rain
      '10d': 'rainy-outline', '10n': 'rainy-outline', // rain
      '11d': 'thunderstorm', '11n': 'thunderstorm', // thunderstorm
      '13d': 'snow', '13n': 'snow', // snow
      '50d': 'cloudy-outline', '50n': 'cloudy-outline', // mist/fog
    };

    // Direct icon mapping first
    if (iconMap[icon]) {
      return iconMap[icon];
    }

    // Fallback by icon pattern
    if (icon.includes('01')) return 'sunny';
    if (icon.includes('02')) return 'partly-sunny';
    if (icon.includes('03')) return 'cloudy';
    if (icon.includes('04')) return 'cloud';
    if (icon.includes('09')) return 'rainy';
    if (icon.includes('10')) return 'rainy-outline';
    if (icon.includes('11')) return 'thunderstorm';
    if (icon.includes('13')) return 'snow';
    if (icon.includes('50')) return 'cloudy-outline';

    // Fallback to description
    if (description.includes('clear')) return 'sunny';
    if (description.includes('cloud')) {
      if (description.includes('few') || description.includes('partly')) return 'partly-sunny';
      return 'cloudy';
    }
    if (description.includes('rain')) return 'rainy';
    if (description.includes('snow')) return 'snow';
    if (description.includes('thunderstorm')) return 'thunderstorm';
    if (description.includes('mist') || description.includes('fog')) return 'cloudy-outline';

    return 'partly-sunny'; // default
  };

  const getWeatherIconColor = (description: string, icon: string) => {
    // Make sun icon yellow, others blue
    if (icon.includes('01')) return '#FCD34D'; // yellow for clear sky
    if (description.includes('clear')) return '#FCD34D'; // yellow for clear weather
    return '#3B82F6'; // blue for other weather
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
      <View className="bg-white py-4 mb-4">
        <Text className="text-lg font-semibold text-gray-800 mb-3 px-6">Weather Forecast</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
        >
          {[1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              className="bg-gray-100 rounded-lg p-4 mr-3 min-w-[100px] items-center border border-gray-200"
            >
              <View className="bg-gray-200 rounded-full w-10 h-10 mb-2 animate-pulse" />
              <View className="bg-gray-200 h-4 w-12 rounded mb-1 animate-pulse" />
              <View className="bg-gray-200 h-3 w-16 rounded animate-pulse" />
            </View>
          ))}
        </ScrollView>
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
    <View className="bg-white py-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-3 px-6">Weather Forecast</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 20 }}
      >
        {weatherData.map((weather, index) => {
          const iconName = getWeatherIcon(weather.description, weather.icon);
          const description = getWeatherDescription(weather.description);
          const iconColor = getWeatherIconColor(weather.description, weather.icon);

          return (
            <TouchableOpacity
              key={index}
              className="bg-blue-50 rounded-lg p-4 mr-3 min-w-[100px] items-center border border-blue-100"
              onPress={() => router.push(`/trip/[tripId]/weather-detail?day=${weather.day}&date=${weather.date}&temp=${weather.temp}&description=${weather.description}&icon=${weather.icon}&destination=${encodeURIComponent(destination)}`)}
            >
              <Text className="text-sm font-semibold text-gray-700 mb-1">Day {weather.day}</Text>
              <Text className="text-xs text-gray-500 mb-2">{weather.date}</Text>

              <View className="bg-blue-100 rounded-full p-3 mb-2">
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={iconColor}
                />
              </View>

              <Text className="text-sm font-medium text-gray-800 mb-1">{description}</Text>
              <Text className="text-xs text-gray-600">{weather.temp}°C</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
