import { supabase } from "@/lib/supabase";
import { Poll } from "./types";

//  CREATE POLL
export async function createPoll({
  tripId,
  question,
  type,
  options,
  userId,
}: {
  tripId: string;
  question: string;
  type: "yes_no" | "multiple";
  options?: string[];
  userId: string;
}) {
  // 1. create poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      trip_id: tripId,
      question,
      type,
      created_by: userId,
    })
    .select()
    .single();

  if (pollError) throw pollError;

  // 2. create options
  let pollOptions = [];

  if (type === "yes_no") {
    pollOptions = ["Yes", "No"];
  } else {
    pollOptions = options || [];
  }

  const optionsToInsert = pollOptions.map((text) => ({
    poll_id: poll.id,
    text,
  }));

  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(optionsToInsert);

  if (optionsError) throw optionsError;

  return poll;
}


// GET POLLS BY TRIP
export async function getPolls(tripId: string) {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      *,
      poll_options (*),
      poll_votes (*)
    `)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Poll[];
}


// VOTE
export async function votePoll({
  pollId,
  optionId,
  userId,
}: {
  pollId: string;
  optionId: string;
  userId: string;
}) {
  // thanks to UNIQUE constraint, this avoids duplicate votes
  const { error } = await supabase.from("poll_votes").upsert({
    poll_id: pollId,
    option_id: optionId,
    user_id: userId,
  },
  {
    onConflict: "poll_id,user_id",
  }
  );

  if (error) throw error;
}


// GET RESULTS
export function getPollResults(poll: Poll) {
  const results: Record<string, number> = {};

  poll.poll_options.forEach((option) => {
    results[option.id] = 0;
  });

  poll.poll_votes.forEach((vote) => {
    if (results[vote.option_id] !== undefined) {
      results[vote.option_id]++;
    }
  });

  return results;
}