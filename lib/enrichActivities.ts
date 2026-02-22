import { ParsedActivity } from "@/types/activity";
import { searchPlace } from "./googlePlaces";

function cleanPlaceName(name: string) {
  return name
    .replace(/morning|afternoon|evening|visit|explore|enjoy|walk|trip|day|tour|full|including|relaxed|leisurely/gi, "")
    .replace(/in the|at the|to the|for|with|and|followed by/gi, "")
    .replace(/^\s+|\s+$/g, "")
    .trim();
}

export async function enrichActivities(
  activities: ParsedActivity[],
  destination?: string
): Promise<ParsedActivity[]> {

  const enriched: ParsedActivity[] = [];

  for (const act of activities) {

    const text = act.name.toLowerCase();

    // 🚫 skip generic non-real places
    if (
      text.includes("arrive") ||
      text.includes("check in") ||
      text.includes("stroll") ||
      text.includes("dinner") ||
      text.includes("lunch") ||
      text.includes("depart") ||
      text.includes("relax") ||
      text.includes("free time") ||
      text.includes("return")
    ) {
      console.log("⏭️ Skipping non-place:", act.name);
      enriched.push(act);
      continue;
    }

    // 🧹 CLEAN NAME
    let cleaned = cleanPlaceName(act.name);

    if (!cleaned || cleaned.length < 3) {
      enriched.push(act);
      continue;
    }

    // 🌍 add destination for better search
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
      console.log("❌ No place found:", searchQuery);
      enriched.push(act);
    }
  }

  return enriched;
}

