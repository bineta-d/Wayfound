# Weather API Integration Guide
Relevent info on how to integrate weather data into the AI itinerary generation feature. The weather system uses Open-Meteo API to provide real-time and forecast weather data for trip planning.

## Available Weather Data

### Data Sources
- **API:** Open-Meteo (free, no API key required)
- **Forecast Range:** Up to 16 days in advance
- **Historical Data:** Available for past dates
- **Coverage:** Global weather data

### Weather Variables Available

#### Current/Hourly Data
```typescript
interface HourlyWeather {
  time: string;           
  temp: number;           
  icon: string;           
  humidity: number;         
  windSpeed: number;      
  precipitation: number; 
  feelsLike: number;     
}
```

#### Daily Data
```typescript
interface DailyWeather {
  day: number;           
  date: string;          
  temp: number;           
  description: string;    
  icon: string;           
}
```

### Weather Conditions Mapping

#### Weather Codes to Descriptions
```typescript
const weatherDescriptions = {
  0: "clear sky",           
  1: "mainly clear",        
  2: "partly cloudy",        
  3: "overcast",            
  45: "fog",                 
  48: "fog",                 
  51: "light drizzle",         
  53: "drizzle",             
  55: "dense drizzle",        
  61: "light rain",          
  63: "rain",                
  65: "heavy rain",          
  71: "light snow",          
  73: "snow",                
  75: "heavy snow",          
  80: "light showers",        
  81: "showers",             
  82: "heavy showers",        
  95: "thunderstorm",        
  96: "thunderstorm",        
  99: "severe thunderstorm"  
};
```

#### Weather Codes to Icons
```typescript
const weatherIcons = {
  0: { day: "sunny", night: "moon" },
  1: { day: "partly-sunny", night: "cloud" },
  2: { day: "partly-sunny", night: "cloud" },
  3: { day: "cloud", night: "cloud" },
  45: { day: "cloudy-outline", night: "cloudy-outline" },
  48: { day: "cloudy-outline", night: "cloudy-outline" },
  51: { day: "rainy-outline", night: "rainy-outline" },
  53: { day: "rainy", night: "rainy" },
  55: { day: "rainy", night: "rainy" },
  61: { day: "rainy-outline", night: "rainy-outline" },
  63: { day: "rainy", night: "rainy" },
  65: { day: "rainy", night: "rainy" },
  71: { day: "snow", night: "snow" },
  73: { day: "snow", night: "snow" },
  75: { day: "snow", night: "snow" },
  80: { day: "rainy-outline", night: "rainy-outline" },
  81: { day: "rainy", night: "rainy" },
  82: { day: "rainy", night: "rainy" },
  85: { day: "snow", night: "snow" },
  86: { day: "snow", night: "snow" },
  95: { day: "thunderstorm", night: "thunderstorm" },
  96: { day: "thunderstorm", night: "thunderstorm" },
  99: { day: "thunderstorm", night: "thunderstorm" }
};
```

## Integration for AI Itinerary Generation

### Step 1: Fetch Weather Data
```typescript
// Import the weather API
const { fetchWeatherApi } = require('openmeteo');

// Get coordinates for destination
const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en`;
const geocodingResponse = await fetch(geocodingUrl);
const geocodingData = await geocodingResponse.json();

if (!geocodingData.results || geocodingData.results.length === 0) {
  throw new Error('Location not found');
}

const { latitude, longitude } = geocodingData.results[0];
```

### Step 2: Get Weather for Trip Dates
```typescript
// Prepare weather parameters
const weatherParams = {
  latitude,
  longitude,
  daily: [
    "temperature_2m_max",
    "temperature_2m_min", 
    "weathercode",
    "precipitation_probability_max"
  ],
  hourly: [
    "temperature_2m",
    "relativehumidity_2m",
    "precipitation_probability",
    "weathercode",
    "windspeed_10m",
    "apparent_temperature"
  ],
  forecast_days: 16,
  timezone: "auto"
};

// Fetch weather data
const responses = await fetchWeatherApi("https://api.open-meteo.com/v1/forecast", weatherParams);
const response = responses[0];
```

### Step 3: Process Weather Data
```typescript
// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number) => {
  return Math.round((celsius * 9 / 5) + 32);
};

// Process daily data
const dailyTime = Array.from(
  { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
  (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
);

const dailyMaxTemp = daily.variables(0)!.valuesArray()!;
const dailyMinTemp = daily.variables(1)!.valuesArray()!;
const dailyWeatherCode = daily.variables(2)!.valuesArray()!;

// Create weather data array
const weatherData = [];
for (let i = 0; i < tripDays; i++) {
  const date = dailyTime[i];
  const maxTemp = dailyMaxTemp[i];
  const minTemp = dailyMinTemp[i];
  const avgTemp = (maxTemp + minTemp) / 2;
  const weatherCode = dailyWeatherCode[i];
  
  weatherData.push({
    day: i + 1,
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    temp: celsiusToFahrenheit(avgTemp),
    description: getWeatherDescription(weatherCode),
    icon: getWeatherIcon(weatherCode, true)
  });
}
```

### Step 4: Use Weather in AI Prompts
```typescript
// Example AI prompt with weather data
const aiPrompt = `
Generate an itinerary for a trip to ${destination} from ${startDate} to ${endDate}.

Weather conditions during the trip:
${weatherData.map(day => `
Day ${day.day} (${day.date}): ${day.description}, ${day.temp}°F
`).join('\n')}

Consider the following weather factors:
- Temperature ranges and appropriate clothing recommendations
- Rain/snow probability and indoor/outdoor activity suggestions
- Wind conditions for outdoor activities
- Humidity levels for comfort considerations

Generate activities that are suitable for the expected weather conditions.
`;

// Send to AI service
const itinerary = await generateItinerary(aiPrompt);


## Key Considerations

### Weather Impact on Activities
- **Hot Weather (80°F+):** Indoor activities, early morning/outdoor, water activities
- **Cold Weather (50°F-):** Indoor activities, layered clothing, heated venues
- **Rain (>60% chance):** Indoor backup plans, covered areas, waterproof gear
- **Snow:** Winter sports, indoor alternatives, warm clothing
- **High Wind (>20 mph):** Avoid tall buildings, bridges, outdoor sports

### Data Accuracy
- **Forecast Accuracy:** Decreases for dates beyond 7 days
- **Historical Data:** Available but may be less detailed
- **Real-time Updates:** Current weather is most accurate
- **Location Specific:** Data is precise to coordinates

### Error Handling
// Handle location not found
if (!geocodingData.results || geocodingData.results.length === 0) {
  console.error('Location not found:', destination);
  return null;
}

// Handle API failures
try {
  const responses = await fetchWeatherApi(url, params);
} catch (error) {
  console.error('Weather API error:', error);
  // Fallback to generic weather suggestions
  return generateGenericWeatherAdvice(destination, season);
}

## Quick Reference

### Common Weather Patterns
- **Clear Sky:** Perfect for outdoor activities, sightseeing, photography
- **Partly Cloudy:** Good for most activities, bring light layers
- **Overcast:** Suitable for indoor activities, museums, shopping
- **Rain:** Need indoor backup, waterproof clothing, umbrellas
- **Snow:** Winter sports, warm clothing, indoor alternatives
- **Thunderstorm:** Seek shelter, avoid outdoor activities

### Temperature Ranges
- **70-80°F:** Warm weather, light clothing, hydration
- **80-90°F:** Hot weather, sun protection, AC venues
- **50-60°F:** Cool weather, layers, light jacket
- **30-40°F:** Cold weather, heavy clothing, indoor focus

This guide provides all necessary information for integrating real weather data into AI-powered itinerary generation.
