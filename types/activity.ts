export interface ParsedActivity {
  dayNumber: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rawText: string;
  place_id?: string;
}
