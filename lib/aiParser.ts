import { ParsedActivity } from "@/types/activity";

export function parseAIItinerary(itinerary: string[]): ParsedActivity[] {
  const activities: ParsedActivity[] = [];

  itinerary.forEach((dayText, index) => {
    const dayNumber = index + 1;

    // Split by commas or dots
    const parts = dayText
      .replace(/Day\s*\d+:/i, "")
      .split(/[.,]/)
      .map(p => p.trim())
      .filter(p => p.length > 3);

    parts.forEach(p => {
      activities.push({
        dayNumber,
        name: p,
        rawText: dayText,
      });
    });
  });

  return activities;
}
