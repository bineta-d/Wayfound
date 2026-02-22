import { supabase } from './supabase';

interface TripPlanRequest {
    destination: string;
    duration: number;
    budget: number;
    preferences: string[];
}

interface TripPlan {
    itinerary: string[];
    recommendations: string[];
    estimatedCost: number;
}

export async function generateTripPlan(request: TripPlanRequest): Promise<TripPlan> {
  try {

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

    if (!data?.itinerary) {
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
    currentPlan: string[],
    constraints: string[]
): Promise<string[]> {
    // AI optimization logic will be implemented here
    return currentPlan;
}
