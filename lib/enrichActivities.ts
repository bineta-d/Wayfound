import { ParsedActivity } from "@/types/activity";
import { searchPlace } from "./googlePlaces";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

// NEW: get extra data (rating, photo, types)
async function getPlaceDetails(placeId: string) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,photos,types&key=${GOOGLE_API_KEY}`
    );

    const data = await res.json();
    const result = data.result;

    if (!result) return {};

    let photoUrl = null;

    if (result.photos && result.photos.length > 0) {
      const ref = result.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${GOOGLE_API_KEY}`;
    }

    return {
      rating: result.rating ?? null,
      photo: photoUrl,
      types: result.types ?? [],
    };

  } catch (err) {
    console.log("❌ Details error:", err);
    return {};
  }
}

export async function enrichActivities(
  activities: ParsedActivity[],
  destination?: string
): Promise<ParsedActivity[]> {

  const enriched: ParsedActivity[] = [];

  for (const act of activities) {

    const lower = act.name.toLowerCase().trim();

    const isLogistics =
      lower.startsWith("arrive") ||
      lower.startsWith("check into") ||
      lower.startsWith("check-in") ||
      lower.startsWith("depart") ||
      lower.startsWith("return to");

    if (isLogistics){
      console.log("⏭️ Skipping logistics:", act.name);
      enriched.push(act);
      continue;
    }

    let cleaned = act.name?.trim();

    if (!cleaned || cleaned.length < 3) {
      enriched.push(act);
      continue;
    }

    cleaned = cleaned
      .replace(/complex|area|district|park|square/gi, "")
      .trim();

    const searchQuery = destination
      ? `${cleaned} ${destination}`
      : cleaned;

    console.log("🔍 SEARCHING:", searchQuery);

    let place = await searchPlace(searchQuery);

    //  fallback
    if (!place) {
      const firstWord = cleaned.split(" ")[0];

      if (firstWord.length > 3) {
        const shorter = destination
          ? `${firstWord} ${destination}`
          : firstWord;

        place = await searchPlace(shorter);
      }
    }

    if (place) {
      console.log("✅ FOUND:", place.name);

      //  GET EXTRA DATA
      const extra = await getPlaceDetails(place.place_id);

      enriched.push({
        ...act,
        name: place.name,
        address: place.address,
        latitude: place.lat,
        longitude: place.lng,
        place_id: place.place_id,

        //  NEW DATA
        rating: extra.rating,
        photo: extra.photo ?? undefined,
        types: extra.types,
      });

    } else {
      console.log("❌ No place found:", searchQuery);
      enriched.push(act);
    }
  }

  return enriched;
}