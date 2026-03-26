import { supabase } from "./supabase";
import { getWeather } from "./weatherService";
import { buildTripContext } from "./contextBuilder";

interface TripPlanRequest {
  tripId: string;
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
    console.log("Calling EDGE FUNCTION");

    // Get weather before calling AI
    const weather  = await getWeather (request.destination);

    const context = await buildTripContext(request.tripId);

    const { data, error } = await supabase.functions.invoke<TripPlan>(
      "generate-itinerary",
      {
        body: {
          request,
          weather,
          context,
        }
      },
    );

    if (error) {
      console.log("Edge function error:", error);
      throw new Error("Failed to generate itinerary");
    }

    if (!data?.itinerary?.days) {
      console.log("RAW AI RESPONSE:", data)
      throw new Error("Invalid AI response");
    }

    return {
      itinerary: data.itinerary,
      recommendations: data.recommendations || [],
      estimatedCost: data.estimatedCost || 0,
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
