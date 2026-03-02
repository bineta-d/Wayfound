// Activity parsed from AI
export interface ParsedActivity {
  dayNumber: number;
  name: string;
  rawText: string;

  //Optional google data
  address?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;

  start_time?: string;
  end_time?: string;
};

// Activity ready for DB insert
export interface StructuredActivity {
  title: string;
  description?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  start_time?: string;
  end_time?: string;
};

// One full day ready for DB
export interface StructuredDay {
  dayNumber: number;
  activities: StructuredActivity[];
};
