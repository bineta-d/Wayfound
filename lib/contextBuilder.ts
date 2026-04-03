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


  // 4. Get documents
  const { data: files, error } = await 
  supabase.storage
    .from("trip-uploads")
    .list(tripId, { limit: 20});


  const documentsText = 
    files && files.length > 0
      ? files.map(files => `- ${files.name}
      `).join("\n")
        : "None";

  // 5. Format context
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

    documents: documentsText,

    bookings: "Parsed from uploaded files (if any)"
  };
}