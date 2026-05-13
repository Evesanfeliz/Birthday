import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setPlayer } from "@/lib/player-storage";
import { generateRoomCode } from "@/lib/useRoom";
import { Sparkles, PartyPopper, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Razzia — Party Challenges & Voting" },
      {
        name: "description",
        content:
          "Create a room, scan the QR, dare your friends. Real-time party challenges with live voting.",
      },
      { property: "og:title", content: "Razzia — Party Challenges & Voting" },
      { property: "og:description", content: "Real-time party game. Dare. Perform. Vote." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function getFriendlyErrorMessage(cause: unknown, fallback: string) {
    if (cause instanceof Error) {
      if (cause.message.includes("Missing Supabase environment variable")) {
        return "Supabase environment variables are missing in this deployment."
      }
      return cause.message || fallback
    }

    return fallback
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setBusy(true);
    setError("");
    try {
      const roomCode = generateRoomCode();
      const { data: room, error: rErr } = await supabase
        .from("rooms")
        .insert({ code: roomCode, phase: "lobby" })
        .select()
        .single();
      if (rErr || !room) {
        setError("Couldn't create room. Try again.");
        return;
      }
      const { data: player, error: pErr } = await supabase
        .from("players")
        .insert({ room_id: room.id, nickname: nickname.trim().slice(0, 20), is_host: true })
        .select()
        .single();
      if (pErr || !player) {
        setError("Couldn't join room.");
        return;
      }
      const { error: uErr } = await supabase.from("rooms").update({ host_player_id: player.id }).eq("id", room.id);
      if (uErr) {
        setError("Room was created, but host setup failed. Try again.");
        return;
      }
      setPlayer(roomCode, player.id, player.nickname);
      navigate({ to: "/r/$code", params: { code: roomCode } });
    } catch (cause) {
      console.error(cause);
      setError(getFriendlyErrorMessage(cause, "Couldn't create room. Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const roomCode = code.trim().toUpperCase();
      const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode)
        .maybeSingle();
      if (!room) {
        setError("Room not found.");
        return;
      }
      const { data: player, error: pErr } = await supabase
        .from("players")
        .insert({ room_id: room.id, nickname: nickname.trim().slice(0, 20) })
        .select()
        .single();
      if (pErr || !player) {
        setError("Couldn't join.");
        return;
      }
      setPlayer(roomCode, player.id, player.nickname);
      navigate({ to: "/r/$code", params: { code: roomCode } });
    } catch (cause) {
      console.error(cause);
      setError(getFriendlyErrorMessage(cause, "Couldn't join."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-secondary" />
          <h1 className="text-stroke text-6xl font-extrabold tracking-tight text-foreground sm:text-7xl">
            Razzia
          </h1>
          <PartyPopper className="h-10 w-10 text-secondary" />
        </div>
        <p className="max-w-md text-lg font-medium text-foreground/85">
          Dare your friends. Perform. Vote. Crown a champion.
        </p>
      </div>

      <div className="w-full max-w-md rounded-3xl bg-card-pop p-6 text-card-foreground shadow-pop">
        {mode === "idle" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-2xl bg-primary px-6 py-5 text-2xl font-bold text-primary-foreground shadow-tile transition-transform hover:translate-y-0.5 active:translate-y-1"
            >
              Join a party
            </button>
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-2xl bg-accent px-6 py-5 text-2xl font-bold text-accent-foreground shadow-tile transition-transform hover:translate-y-0.5 active:translate-y-1"
            >
              Create a party
            </button>
          </div>
        )}

        {mode === "join" && (
          <form onSubmit={joinRoom} className="space-y-4">
            <h2 className="text-2xl font-bold">Join a party</h2>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={5}
              className="w-full rounded-xl border-2 border-border/30 bg-muted px-4 py-4 text-center text-3xl font-bold tracking-[0.4em] uppercase text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              style={{ color: "var(--color-card-foreground)" }}
            />
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              maxLength={20}
              className="w-full rounded-xl border-2 border-border/30 bg-muted px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
              style={{ color: "var(--color-card-foreground)" }}
            />
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            <SubmitBtn busy={busy}>Join</SubmitBtn>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="w-full text-sm font-semibold text-muted-foreground hover:underline"
            >
              ← Back
            </button>
          </form>
        )}

        {mode === "create" && (
          <form onSubmit={createRoom} className="space-y-4">
            <h2 className="text-2xl font-bold">Create a party</h2>
            <input
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname (you're the host)"
              maxLength={20}
              className="w-full rounded-xl border-2 border-border/30 bg-muted px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
              style={{ color: "var(--color-card-foreground)" }}
            />
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            <SubmitBtn busy={busy}>Create room</SubmitBtn>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="w-full text-sm font-semibold text-muted-foreground hover:underline"
            >
              ← Back
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-sm font-medium text-foreground/70">
        Built for birthdays 🎂 and chaos
      </p>
    </main>
  );
}

function SubmitBtn({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-xl font-bold text-primary-foreground shadow-tile transition-transform hover:translate-y-0.5 active:translate-y-1 disabled:opacity-60"
    >
      {busy && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}
