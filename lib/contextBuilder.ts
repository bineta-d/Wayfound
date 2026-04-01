import { supabase } from "./supabase";

export async function buildTripContext(tripId: string) {
  // 1. Get accommodations
  const { data: accommodations } = await supabase
    .from("accommodations")
    .select("*")
    .eq("trip_id", tripId);

  // 2. Get transport
  const { data: transport } = await supabase
    .from("travel_transportation")
    .select("*")
    .eq("trip_id", tripId);

  // 3. Get activities
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("trip_id", tripId);

  // 4. Format context
  return {
    accommodation: accommodations?.map(a =>
      `${a.name} at ${a.address} (check-in: ${a.check_in_time})`
    ).join("\n") || "None",

    transport: transport?.map(t =>
      `${t.transport_type} from ${t.departure_location} to ${t.arrival_location} at ${t.departure_time}`
    ).join("\n") || "None",

    activities: activities?.map(a =>
      `${a.title} at ${a.start_time}`
    ).join("\n") || "None",

    bookings: "Parsed from uploaded files (if any)"
  };
}