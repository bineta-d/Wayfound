import { supabase } from './supabase';

interface TripPlanRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  interests: string[];
  prompt: string;
}

interface TripPlan {
  itinerary: any[];
  recommendations: string[];
  estimatedCost: number;
}

export async function generateTripPlan(request: TripPlanRequest): Promise<TripPlan> {
  try {

    console.log("Sending to AI:", request);

    const { data, error } = await supabase.functions.invoke(
      "generate-itinerary",
      {
        body: request,
      }
    );

    if (error) {
      console.log("Edge function error:", error);
      throw new Error("Failed to generate itinerary");
    }

    if (!data) {
      throw new Error("Empty AI response");
    }

    console.log("AI RESPONSE:", data);

    return {
      itinerary: data.itinerary || [],
      recommendations: data.recommendations || [],
      estimatedCost: data.estimatedCost || 0,
    };

  } catch (error) {
    console.error("AI generation error:", error);
    throw error;
  }
}





export async function optimizeItinerary(
    currentPlan: string[],
    constraints: string[]
): Promise<string[]> {
    // AI optimization logic will be implemented here
    return currentPlan;
}
