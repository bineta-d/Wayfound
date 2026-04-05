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
  const { data: files } = await supabase.storage
    .from("trip-uploads")
    .list(tripId, { limit: 20 });

  const documentsText =
    files && files.length > 0
      ? files.map(file => `- ${file.name}`).join("\n")
      : "None";

  // 5. Format context (🔥 MEJORADO)

  const formattedAccommodations =
    accommodations?.map(a =>
      `Stay at ${a.name ?? "Unknown"} 
      Address: ${a.address ?? "Unknown"} 
      Check-in: ${a.check_in_time ?? "unknown"} 
      Check-out: ${a.check_out_time ?? "unknown"}`
    ).join("\n\n") || "None";

  const formattedTransport =
    transport?.map(t =>
      `${t.transport_type ?? "Transport"} 
      From: ${t.departure_location ?? "unknown"} 
      To: ${t.arrival_location ?? "unknown"} 
      Departure: ${t.departure_time ?? "unknown"} 
      Arrival: ${t.arrival_time ?? "unknown"}`
    ).join("\n\n") || "None";

  const formattedActivities =
    activities?.map(a =>
      `${a.title ?? a.title ?? "Activity"} 
      Location: ${a.location_name ?? "unknown"} 
      Start: ${a.start_time ?? "unknown"} 
      End: ${a.end_time ?? "unknown"}`
    ).join("\n\n") || "None";

  return {
    accommodation: formattedAccommodations,
    transport: formattedTransport,
    activities: formattedActivities,

    // OCR raw (files)
    documents: documentsText,

    // Structured bookings
    bookings: `
    ACCOMMODATIONS:
    ${formattedAccommodations}

    TRANSPORT:
    ${formattedTransport}

    ACTIVITIES:
    ${formattedActivities}
    `.trim(),
  };
}