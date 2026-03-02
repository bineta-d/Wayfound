import { ParsedActivity } from "@/types/activity";
import { searchPlace } from "./googlePlaces";

function cleanPlaceName(name: string) {
  if (!name) return "";

  let cleaned = name;

  // Remove time blocks (Morning 8:00-12:00 etc)
  cleaned = cleaned.replace(
    /(morning|afternoon|evening|night)\s*\([^)]*\)\s*:/gi,
    ""
  );

  // Remove starting verbs only (NOT inside sentence)
  cleaned = cleaned.replace(
    /^(visit|explore|enjoy|walk|discover|experience|take|wander|head to|go to|stop at)\s+/i,
    ""
  );

  // Remove "lunch at", "dinner at", but KEEP place
  cleaned = cleaned.replace(
    /^(lunch|dinner|breakfast|brunch)\s+(at|in)\s+/i,
    ""
  );

  // Remove travel/logistics beginnings
  cleaned = cleaned.replace(
    /^(arrive at|depart from|return to|check into|check-in at)\s+/i,
    ""
  );

  // Remove filler connectors
  cleaned = cleaned.replace(
    /\b(afterward|afterwards|then|later|followed by|before heading to)\b/gi,
    ""
  );

  // Remove extra punctuation but keep names
  cleaned = cleaned.replace(/[.]/g, " ");

  // Remove long descriptions in parentheses
  cleaned = cleaned.replace(/\(.*?\)/g, "").trim();

  // Collapse spaces
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();



  // If multiple places in sentence → keep first chunk
  if (cleaned.includes(" and ")) {
    cleaned = cleaned.split(" and ")[0];
  }

  if (cleaned.includes(" then ")) {
    cleaned = cleaned.split(" then ")[0];
  }

  // If quoted place exists → use it directly
  const quoted = cleaned.match(/"([^"]+)"/);
  if (quoted && quoted[1]) {
    return quoted[1].trim();
  }
  return cleaned;
}

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

    // Clean name
    let cleaned = cleanPlaceName(act.name);

    if (!cleaned || cleaned.length < 3) {
      enriched.push(act);
      continue;
    }

    // Add destination for better search
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