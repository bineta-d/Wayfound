import { supabase } from "@/lib/supabase";
import { ParsedActivity } from "@/types/activity";


// Save Itinerary
export const saveItinerary = async (
  tripId: string,
  startDate: string,
  activities: ParsedActivity[]
) => {
  try {
    console.log("💾 Saving itinerary for trip: ", tripId);

    // Delete previous itinerary (avoid duplicates)
    const { data: existingDays } = await supabase
        .from("itinerary_days")
        .select("id")
        .eq("trip_id", tripId);

    if (existingDays && existingDays.length > 0) {
        const dayIds = existingDays.map(d => d.id);

        await supabase
        .from("activities")
        .delete()
        .in("itinerary_day_id", dayIds);

      await supabase
        .from("itinerary_days")
        .delete()
        .eq("trip_id", tripId);
    }


    // Group activities by day
    const groupedByDay = activities.reduce((acc, act) => {
      if (!acc[act.dayNumber]) acc[act.dayNumber] = [];
      acc[act.dayNumber].push(act);
      return acc;
    }, {} as Record<number, ParsedActivity[]>);


    // Insert days + activities
    for (const dayNumberStr of Object.keys(groupedByDay)) {
      const dayNumber = Number(dayNumberStr);

      // Calculate real date
      const date = new Date(startDate);
      date.setDate(date.getDate() + (dayNumber - 1));

      const formattedDate = date.toISOString().split("T")[0];

      // Insert day
      const { data: dayData, error: dayError } = await supabase
        .from("itinerary_days")
        .insert({
          trip_id: tripId,
          day_date: formattedDate,
        })
        .select()
        .single();

      if (dayError) throw dayError;

      const dayId = dayData.id;

      // Insert activities
      const activitiesToInsert = groupedByDay[dayNumber].map(act => ({
        itinerary_day_id: dayId,
        title: act.name,
        description: act.rawText ?? null,
        location_name: act.name ?? null,
        latitude: act.latitude ?? null,
        longitude: act.longitude ?? null,
        start_time: act.start_time ?? null,
        end_time: act.end_time ?? null,
      }));

      if (activitiesToInsert.length > 0) {
        const { error: activityError } = await supabase
          .from("activities")
          .insert(activitiesToInsert);

        if (activityError) throw activityError;
      }
    }

    console.log("✅ Itinerary saved successfully");
    return true;

  }catch (error){
    console.error("❌ Error saving itinerary:", error);
    throw error;
  }
};


// Get TripItinerary
export const getTripItinerary = async (tripId: string) => {
  try {
    // 1. Get days
    const { data: days, error: daysError } = await supabase
      .from("itinerary_days")
      .select("*")
      .eq("trip_id", tripId)
      .order("day_date", { ascending: true });

    if (daysError) throw daysError;

    if (!days || days.length === 0) return [];

    // 2. Get activities
    const dayIds = days.map(d => d.id);

    const { data: activities, error: actError } = await supabase
      .from("activities")
      .select("*")
      .in("itinerary_day_id", dayIds)
      .order("start_time", { ascending: true });

    if (actError) throw actError;

    // 3. Attach activities to days
    const structured = days.map(day => ({
      ...day,
      activities: activities?.filter(a => a.itinerary_day_id === day.id) || []
    }));

    console.log("📦 Loaded itinerary from DB:", structured);

    return structured;

  } catch (err) {
    console.error("❌ Error loading itinerary:", err);
    throw err;
  }
};