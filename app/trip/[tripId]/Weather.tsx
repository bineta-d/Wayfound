import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
const { fetchWeatherApi } = require('openmeteo');

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

      // Calculate number of days between start and end dates
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate());
      const end = new Date(currentDate);
      end.setDate(currentDate.getDate() + Math.min(17, 30)); // Use current date + days for demo
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      console.log('📅 Weather duration (from today):', daysDiff, 'days from', start.toISOString(), 'to', end.toISOString());

      // Get coordinates for the destination using Open-Meteo geocoding
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en`;
      const geocodingResponse = await fetch(geocodingUrl);
      const geocodingData = await geocodingResponse.json();

      if (!geocodingData.results || geocodingData.results.length === 0) {
        console.error('❌ Location not found:', destination);
        setError('Location not found');
        setLoading(false);
        return;
      }

      const { latitude, longitude } = geocodingData.results[0];
      console.log('📍 Location coordinates:', { latitude, longitude, name: geocodingData.results[0].name });

      // Prepare weather variables for Open-Meteo
      const weatherParams = {
        latitude,
        longitude,
        hourly: [
          "temperature_2m",
          "relativehumidity_2m",
          "precipitation_probability",
          "weathercode",
          "windspeed_10m"
        ],
        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "weathercode",
          "precipitation_probability_max"
        ],
        forecast_days: Math.min(16, daysDiff), // Extended forecast up to 16 days
        timezone: "auto"
      };

      console.log('🔍 Fetching weather with params:', weatherParams);

      // Fetch weather data from Open-Meteo
      const responses = await fetchWeatherApi("https://api.open-meteo.com/v1/forecast", weatherParams);
      const response = responses[0];

      // Process the response
      const utcOffsetSeconds = response.utcOffsetSeconds();
      const daily = response.daily()!;
      const hourly = response.hourly()!;

      console.log('📊 Raw Open-Meteo response processed');

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

      const celsiusToFahrenheit = (celsius: number) => {
        return Math.round((celsius * 9 / 5) + 32);
      };

      // Process daily weather data
      const formattedWeather: WeatherData[] = [];
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // Get daily data arrays
      const dailyTime = Array.from(
        { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
        (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
      );

      const dailyMaxTemp = daily.variables(0)!.valuesArray()!;
      const dailyMinTemp = daily.variables(1)!.valuesArray()!;
      const dailyWeatherCode = daily.variables(2)!.valuesArray()!;
      const dailyPrecipProb = daily.variables(3)!.valuesArray()!;

      console.log('📊 Processing daily weather data');

      for (let i = 0; i < daysDiff && i < dailyTime.length; i++) {
        const date = dailyTime[i];
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];

        // Check if date is in the past, today, or future
        if (date.getTime() === todayDate.getTime()) {
          console.log(`📅 Day ${i + 1} is today (${dateKey}), showing current weather`);

          const maxTemp = dailyMaxTemp[i];
          const minTemp = dailyMinTemp[i];
          const avgTemp = (maxTemp + minTemp) / 2;
          const weatherCode = dailyWeatherCode[i];

          const weatherInfo = {
            day: i + 1,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            temp: Math.round(celsiusToFahrenheit(avgTemp)),
            description: getWeatherDescription(weatherCode),
            icon: getWeatherIcon(weatherCode, true)
          };

          console.log(`📊 Day ${i + 1} current weather:`, weatherInfo);
          formattedWeather.push(weatherInfo);
        } else if (date < todayDate) {
          console.log(`📅 Day ${i + 1} is in the past (${dateKey}), showing historical data`);

          const maxTemp = dailyMaxTemp[i];
          const minTemp = dailyMinTemp[i];
          const avgTemp = (maxTemp + minTemp) / 2;
          const weatherCode = dailyWeatherCode[i];

          const weatherInfo = {
            day: i + 1,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            temp: Math.round(celsiusToFahrenheit(avgTemp)),
            description: getWeatherDescription(weatherCode),
            icon: getWeatherIcon(weatherCode, true)
          };

          console.log(`📊 Day ${i + 1} historical weather:`, weatherInfo);
          formattedWeather.push(weatherInfo);
        } else {
          console.log(`📅 Day ${i + 1} is in the future (${dateKey}), showing forecast weather`);

          const maxTemp = dailyMaxTemp[i];
          const minTemp = dailyMinTemp[i];
          const avgTemp = (maxTemp + minTemp) / 2;
          const weatherCode = dailyWeatherCode[i];

          const weatherInfo = {
            day: i + 1,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            temp: Math.round(celsiusToFahrenheit(avgTemp)),
            description: getWeatherDescription(weatherCode),
            icon: getWeatherIcon(weatherCode, true)
          };

          console.log(`📊 Day ${i + 1} forecast weather:`, weatherInfo);
          formattedWeather.push(weatherInfo);
        }
      }

      // Handle days beyond available forecast data
      for (let i = formattedWeather.length; i < daysDiff; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        date.setHours(0, 0, 0, 0);

        console.log(`📅 Day ${i + 1} no forecast data available for ${date.toISOString().split('T')[0]}, showing pending`);
        const weatherInfo = {
          day: i + 1,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          temp: 0,
          description: 'data pending',
          icon: 'time'
        };
        console.log(`📊 Day ${i + 1} pending weather:`, weatherInfo);
        formattedWeather.push(weatherInfo);
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
              <Text className="text-xs text-gray-600">{weather.temp}°F</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
