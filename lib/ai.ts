import { supabase } from "./supabase";

interface TripPlanRequest {
  startDate: string;
  endDate: string;
  destination: string;
  duration?: number;
  budget: number;
  preferences?: string[];
  interests: string[];
  prompt?: string;
  context?: string;
}

interface AIActivity {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
}

interface AIDay {
  day: number;
  activities: AIActivity[];
}

interface TripPlan {
  itinerary: {
    days: AIDay[];
  };
  recommendations: string[];
  estimatedCost: number;
}

export async function generateTripPlan(
  request: TripPlanRequest,
): Promise<TripPlan> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "generate-itinerary",
      {
        body: request,
      },
    );

    if (error) {
      console.log("Edge function error:", error);
      throw new Error("Failed to generate itinerary");
    }

    if (!data?.itinerary) {
      throw new Error("Invalid AI response");
    }

    return {
      itinerary: data.itinerary,
    };
  } catch (error) {
    console.error("AI generation error:", error);
    throw error;
  }
}

export async function optimizeItinerary(
  currentPlan: AIDay[],
  constraints: string[],
): Promise<AIDay[]> {
  // AI optimization logic will be implemented here
  return currentPlan;
}
