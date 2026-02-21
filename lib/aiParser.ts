import { ParsedActivity } from "@/types/activity";

export function parseAIItinerary(days: string[]): ParsedActivity[] {
  const activities: ParsedActivity[] = [];

  days.forEach((dayText, index) => {
    const dayNumber = index + 1;

    // split by Morning/Afternoon/Evening blocks
    const blocks = dayText.split(
      /(Morning\s*\(.*?\):|Afternoon\s*\(.*?\):|Evening\s*\(.*?\):)/g
    );

    for (let i = 1; i < blocks.length; i += 2) {
      const timeHeader = blocks[i];       // "Morning (8:00-12:00):"
      const description = blocks[i + 1];  // "Visit Acropolis..."

      if (!timeHeader || !description) continue;

      // extract time range
      const timeMatch = timeHeader.match(/\((\d{1,2}:\d{2})-(\d{1,2}:\d{2})\)/);

      const start_time = timeMatch ? timeMatch[1] : null;
      const end_time = timeMatch ? timeMatch[2] : null;

      // clean title
      const cleanTitle = description
        .replace(/\n/g, " ")
        .replace(/\./g, "")
        .trim();

      activities.push({
        dayNumber,
        name: cleanTitle,
        rawText: dayText,
        start_time: start_time || undefined,
        end_time: end_time || undefined,
      });
    }
  });
  return activities;
}