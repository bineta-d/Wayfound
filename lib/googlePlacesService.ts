interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface PlacesResponse {
  results: Place[];
  status: string;
  next_page_token?: string;
}

interface PlaceDetailsResponse {
  result: Place;
  status: string;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("Google API key is missing");
}

class GooglePlacesService {
  private baseUrl = "https://maps.googleapis.com/maps/api/place";

  async searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
    radius?: number,
  ): Promise<Place[]> {
    try {
      let url = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

      if (location) {
        url += `&location=${location.lat},${location.lng}`;
      }

      if (radius) {
        url += `&radius=${radius}`;
      }

      const response = await fetch(url);
      const data: PlacesResponse = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      return data.results || [];
    } catch (error) {
      console.error("Error searching places:", error);
      throw error;
    }
  }

  async getPopularDestinations(): Promise<Place[]> {
    try {
      // Search for specific major cities and capitals worldwide
      const queries = [
        "London United Kingdom",
        "Tokyo Japan",
        "Paris France",
        "Rome Italy",
        "Barcelona Spain",
        "Amsterdam Netherlands",
        "Berlin Germany",
        "Vienna Austria",
        "Prague Czech Republic",
        "Budapest Hungary",
        "Athens Greece",
        "Moscow Russia",
        "Madrid Spain",
        "Lisbon Portugal",
        "Stockholm Sweden",
        "Oslo Norway",
        "Helsinki Finland",
        "Warsaw Poland",
        "Bangkok Thailand",
        "Singapore",
        "Dubai UAE",
        "Seoul South Korea",
        "Beijing China",
        "Jakarta Indonesia",
        "Manila Philippines",
        "Bangalore India",
        "Kuala Lumpur Malaysia",
        "Mumbai India",
        "Istanbul Turkey",
        "Sydney Australia",
        "Cape Town South Africa",
        "Cairo Egypt",
        "Rio de Janeiro Brazil",
        "Buenos Aires Argentina",
        "Mexico City Mexico",
        "Lima Peru",
      ];

      const allResults: Place[] = [];

      for (const query of queries) {
        try {
          const results = await this.searchPlaces(query);
          allResults.push(...results.slice(0, 1)); // Take top 1 for each city
        } catch (error) {
          console.error(`Error fetching destinations for ${query}:`, error);
        }
      }

      // Remove duplicates based on place_id
      const uniqueResults = allResults.filter(
        (place, index, self) =>
          index === self.findIndex((p) => p.place_id === place.place_id),
      );

      return uniqueResults.slice(0, 35); // Return max 35 destinations
    } catch (error) {
      console.error("Error getting popular destinations:", error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    try {
      const fields = [
        "name",
        "rating",
        "formatted_address",
        "geometry",
        "photos",
        "website",
        "international_phone_number",
        "formatted_phone_number",
        "opening_hours",
        "reviews",
      ].join(",");

      const url = `${this.baseUrl}/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data: PlaceDetailsResponse = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      return data.result;
    } catch (error) {
      console.error("Error getting place details:", error);
      throw error;
    }
  }

  getPhotoUrl(photoReference: string, maxWidth = 400): string {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
  }

  async getAttractions(destination: string): Promise<Place[]> {
    try {
      const query = `attractions in ${destination}`;
      return await this.searchPlaces(query);
    } catch (error) {
      console.error("Error getting attractions:", error);
      throw error;
    }
  }

  async getRestaurants(destination: string): Promise<Place[]> {
    try {
      const query = `restaurants in ${destination}`;
      return await this.searchPlaces(query);
    } catch (error) {
      console.error("Error getting restaurants:", error);
      throw error;
    }
  }

  async getPhotoSpots(destination: string): Promise<Place[]> {
    try {
      const query = `photo spots scenic viewpoints in ${destination}`;
      return await this.searchPlaces(query);
    } catch (error) {
      console.error("Error getting photo spots:", error);
      throw error;
    }
  }
}

export default new GooglePlacesService();
