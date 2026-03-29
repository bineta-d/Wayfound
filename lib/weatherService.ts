export interface WeatherDay {
  day: number;
  condition: "sunny" | "rainy" | "cloudy";
  temperature: number;
}

function mapWeatherCode(code: number): "sunny" | "rainy" | "cloudy" {
  if (code === 0) return "sunny";
  if ([1, 2, 3].includes(code)) return "cloudy";
  return "rainy";
}

export async function getWeather(
  destination: string
): Promise<WeatherDay[]> {
  try {
    console.log("🌤️ Open-Meteo weather for:", destination);

    // Geocoding
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`
    );

    const geoData = await geoRes.json();

    if (!geoData.results?.length) {
      throw new Error("Location not found");
    }

    const { latitude, longitude } = geoData.results[0];

    // Forecast
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max&timezone=auto`
    );

    const data = await weatherRes.json();

    // Transform
    const result: WeatherDay[] = data.daily.time.map(
      (_: string, index: number) => ({
        day: index + 1,
        condition: mapWeatherCode(data.daily.weathercode[index]),
        temperature: Math.round(data.daily.temperature_2m_max[index]),
      })
    );

    return result.slice(0, 5);
  } catch (error) {
    console.error("❌ weather error:", error);
    return [];
  }
}