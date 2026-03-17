import { ParsedActivity } from "@/types/activity";
import { searchPlace } from "./googlePlaces";


export async function enrichActivities(
  activities: ParsedActivity[],
  destination?: string
): Promise<ParsedActivity[]> {

  const enriched: ParsedActivity[] = [];

  for (const act of activities) {
    // Skip only pure logistics (not real places)
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

    // Clean search query slightly
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

    const place = await searchPlace(searchQuery);

    if (place) {
      console.log("✅ FOUND:", place.name);

      enriched.push({
        ...act,
        name: place.name,
        address: place.address,
        latitude: place.lat,
        longitude: place.lng,
        place_id: place.place_id,
      });

    } else {
        // try shorter search
        const firstWord = cleaned.split(" ")[0];
        if (firstWord.length > 3){

          const shorter = destination
            ? `${cleaned.split(" ")[0]} ${destination}`
            : cleaned.split(" ")[0];



          const retry = await searchPlace(shorter);

          if (retry) {
            console.log("🔁 RETRY FOUND:", retry.name);

            enriched.push({
              ...act,
              name: retry.name,
              address: retry.address,
              latitude: retry.lat,
              longitude: retry.lng,
              place_id: retry.place_id,
            });

            continue;
          }
        }

      console.log("❌ No place found:", searchQuery);
      enriched.push(act);
    }
  }

  return enriched;
}