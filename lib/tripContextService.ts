import { supabase } from "@/lib/supabase";

export const getTripContext = async (tripId: string) => {

  const { data: accommodation } = await supabase
    .from("accommodations")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle();

  const { data: transport } = await supabase
    .from("travel_transportation")
    .select("*")
    .eq("trip_id", tripId);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("trip_id", tripId);

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("trip_id", tripId);

  return {
    accommodation,
    transport,
    bookings,
    activities
  };
};