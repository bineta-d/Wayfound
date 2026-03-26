export interface WeatherDay {
  day: number;
  condition: "sunny" | "rainy" | "cloudy";
  temperature: number;
}

export async function getWeather(destination: string): Promise<WeatherDay[]> {
  try {
    console.log("🌤️ Fetching weather for:", destination);

    // MOCK DATA
    return [
      { day: 1, condition: "sunny", temperature: 28 },
      { day: 2, condition: "rainy", temperature: 22 },
      { day: 3, condition: "cloudy", temperature: 25 },
      { day: 4, condition: "sunny", temperature: 30 },
      { day: 5, condition: "rainy", temperature: 21 },
    ];
  } catch (error) {
    console.error("Weather error:", error);
    return [];
  }
}