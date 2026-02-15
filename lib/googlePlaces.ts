const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export async function searchPlace(place: string) {
  try {

    const url =
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${encodeURIComponent(place)}` +
      `&region=us` +              
      `&language=en` +            
      `&key=${GOOGLE_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      console.log("❌ No place found:", place);
      return null;
    }

    const result = data.results[0];

    console.log("✅ FOUND PLACE:", result.name);

    return {
      name: result.name,
      address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      place_id: result.place_id,
    };

  } catch (err) {
    console.log("Google places error:", err);
    return null;
  }
}
