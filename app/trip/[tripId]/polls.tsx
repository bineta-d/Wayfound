import { createPoll, getPolls, votePoll } from "@/lib/pollService";
import { supabase } from "@/lib/supabase";
import { Poll } from "@/lib/types";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PollsScreen() {
  const { tripId } = useLocalSearchParams();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUserId().then(setUserId);
    loadPolls();
  }, []);

  async function getUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("User not authenticated");
    return data.user.id;
  }

  async function loadPolls() {
    const data = await getPolls(tripId as string);
    setPolls(data || []);
  }

  async function handleCreatePoll() {
    if (!userId) return;

    if (!question.trim()){
        alert("Please enter a question");
    }

    if (!options.trim()){
        alert("Please enter at least one option");
    }

    const opts = options.split(",").map(o => o.trim());

    try{
        setLoading(true);

        await createPoll({
        tripId: tripId as string,
        question,
        type: "multiple",
        options: opts,
        userId,
        });

        setQuestion("");
        setOptions("");
        loadPolls();
    } catch(e){
        console.error(e)
        alert("Failed to create Poll");
    } finally{
        setLoading(false);
    }
    
  }

  async function handleVote(pollId: string, optionId: string) {
    if (!userId) return;

    try{

    
        await votePoll({
        pollId,
        optionId,
        userId,
        });
        loadPolls();
    }catch(e){
        console.error(e);
        alert("Failed to vote");
    }
  }

  return (
    <View style={{ padding: 16 }}>
      {/* CREATE POLL */}
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Create Poll</Text>

      <TextInput
        placeholder="Question"
        value={question}
        onChangeText={setQuestion}
        style={{ borderWidth: 1, marginVertical: 8, padding: 8, borderRadius: 6 }}
      />

      <TextInput
        placeholder="Options (comma separated)"
        value={options}
        onChangeText={setOptions}
        style={{ borderWidth: 1, marginVertical: 8, padding: 8, borderRadius: 6 }}
      />

      <TouchableOpacity
        onPress={handleCreatePoll}
        disabled={loading}
        style={{
          backgroundColor: "#3B82F6",
          padding: 12,
          borderRadius: 6,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {loading ? "Creating..." : "Create Poll"}
        </Text>
      </TouchableOpacity>

      {/* POLLS */}
      <Text style={{ fontSize: 20, marginTop: 10, fontWeight: "bold" }}>
        Polls
      </Text>

      {polls.map((poll) => {
        const totalVotes = poll.poll_votes.length;

        return (
          <View
            key={poll.id}
            style={{
              marginVertical: 12,
              padding: 14,
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: "#fff",
            }}
          >
            {/* QUESTION */}
            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
              {poll.question}
            </Text>

            {/* OPTIONS */}
            {poll.poll_options.map((opt) => {
              const votes = poll.poll_votes.filter(
                (v) => v.option_id === opt.id
              ).length;

              const percentage =
                totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

              const userVote = poll.poll_votes.find(
                (v) => v.user_id === userId
              );

              const isSelected = userVote?.option_id === opt.id;

              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => {
                    if (isSelected) return;
                    handleVote(poll.id, opt.id)}}
                  style={{
                    marginVertical: 6,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: isSelected ? "#FDE7EF" : "#F3F4F6",
                  }}
                >
                  {/* BAR BACKGROUND */}
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      backgroundColor: isSelected ? "#D81E5B" : "#93C5FD",
                      borderRadius: 8,
                      opacity: 0.25,
                    }}
                  />

                  {/* TEXT */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      {opt.text}
                    </Text>

                    <Text>
                      {votes} • {percentage}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* TOTAL */}
            <Text style={{ marginTop: 8, color: "#6B7280" }}>
              {totalVotes} votes
            </Text>
          </View>
        );
      })}
    </View>
  );
}