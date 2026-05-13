import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];

export function useRoomData(roomCode: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: r } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .maybeSingle();
    if (!r) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setRoom(r);
    const [{ data: ps }, { data: cs }] = await Promise.all([
      supabase.from("players").select("*").eq("room_id", r.id).order("joined_at"),
      supabase
        .from("challenges")
        .select("*")
        .eq("room_id", r.id)
        .order("created_at", { ascending: false }),
    ]);
    setPlayers(ps || []);
    setChallenges(cs || []);
    if (cs && cs.length > 0) {
      const ids = cs.map((c) => c.id);
      const { data: vs } = await supabase.from("votes").select("*").in("challenge_id", ids);
      setVotes(vs || []);
    } else {
      setVotes([]);
    }
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, refresh]);

  return { room, players, challenges, votes, loading, refresh };
}

export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
