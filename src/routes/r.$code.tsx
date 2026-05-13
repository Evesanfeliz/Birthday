import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { getPlayer, setPlayer, clearPlayer } from "@/lib/player-storage";
import { useRoomData, type Player, type Challenge } from "@/lib/useRoom";
import { CHALLENGE_DECK, pickRandomChallenge } from "@/lib/challenge-deck";
import {
  Crown,
  Loader2,
  Mic,
  Trophy,
  Users,
  Star,
  Shuffle,
  ArrowRight,
  Copy,
  Check,
  LogOut,
  Send,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/r/$code")({
  component: RoomPage,
});

type Room = {
  id: string;
  code: string;
  phase: string;
  round: number;
  current_challenge_id: string | null;
  host_player_id: string | null;
};

function RoomPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { room, players, challenges, votes, loading } = useRoomData(code);
  const stored = typeof window !== "undefined" ? getPlayer(code) : undefined;
  const me = useMemo(() => players.find((p) => p.id === stored?.playerId), [players, stored]);

  if (loading) return <Center><Loader2 className="h-10 w-10 animate-spin text-foreground" /></Center>;

  if (!room) {
    return (
      <Center>
        <div className="text-center">
          <h1 className="text-stroke text-5xl font-extrabold">Room not found</h1>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-6 rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-tile"
          >
            Go home
          </button>
        </div>
      </Center>
    );
  }

  if (!me) return <JoinFromLink code={code} />;

  const r = room as Room;
  const currentChallenge = challenges.find((c) => c.id === r.current_challenge_id) || null;
  const isHost = me.is_host;
  const roundChallenges = challenges.filter((c) => (c as any).round === r.round);

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Header code={code} me={me} round={r.round} phase={r.phase} onLeave={() => { clearPlayer(code); navigate({ to: "/" }); }} />

        {r.phase === "lobby" && (
          <Lobby code={code} players={players} me={me} room={r} isHost={isHost} />
        )}
        {r.phase === "submitting" && (
          <SubmittingPhase players={players} me={me} room={r} roundChallenges={roundChallenges} isHost={isHost} />
        )}
        {r.phase === "performing" && currentChallenge && (
          <PerformingPhase challenge={currentChallenge} players={players} me={me} room={r} />
        )}
        {r.phase === "voting" && currentChallenge && (
          <VotingPhase
            challenge={currentChallenge}
            players={players}
            me={me}
            room={r}
            roundChallenges={roundChallenges}
            votes={votes.filter((v) => v.challenge_id === currentChallenge.id)}
          />
        )}
        {r.phase === "results" && (
          <ResultsPhase
            players={players}
            me={me}
            room={r}
            roundChallenges={roundChallenges}
            isHost={isHost}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Sub-components ---------- */

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-6">{children}</div>;
}

function Header({ code, me, round, phase, onLeave }: { code: string; me: Player; round: number; phase: string; onLeave: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-card-pop px-3 py-1.5 font-bold tracking-widest text-card-foreground shadow-tile">
          {code}
        </span>
        {phase !== "lobby" && (
          <span className="rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">
            Round {round}
          </span>
        )}
        <span className="text-sm font-semibold text-foreground/80">
          {me.nickname} {me.is_host && <Crown className="inline h-4 w-4 text-secondary" />}
        </span>
      </div>
      <button
        onClick={onLeave}
        className="flex items-center gap-1 rounded-lg bg-foreground/10 px-3 py-1.5 text-sm font-semibold text-foreground/90 hover:bg-foreground/20"
      >
        <LogOut className="h-4 w-4" /> Leave
      </button>
    </div>
  );
}

function JoinFromLink({ code }: { code: string }) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setBusy(true);
    const { data: room } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();
    if (!room) { setErr("Room not found"); setBusy(false); return; }
    const { data: player, error } = await supabase
      .from("players")
      .insert({ room_id: room.id, nickname: nickname.trim().slice(0, 20) })
      .select().single();
    if (error || !player) { setErr("Couldn't join"); setBusy(false); return; }
    setPlayer(code, player.id, player.nickname);
    navigate({ to: "/r/$code", params: { code } });
  }

  return (
    <Center>
      <form onSubmit={join} className="w-full max-w-md rounded-3xl bg-card-pop p-6 text-card-foreground shadow-pop">
        <h1 className="mb-1 text-3xl font-bold">Join room</h1>
        <p className="mb-4 font-semibold tracking-widest text-muted-foreground">{code}</p>
        <input
          autoFocus
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your nickname"
          maxLength={20}
          className="w-full rounded-xl border-2 border-border/30 bg-muted px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
        />
        {err && <p className="mt-2 text-sm font-semibold text-destructive">{err}</p>}
        <button
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-xl font-bold text-primary-foreground shadow-tile disabled:opacity-60"
        >
          {busy && <Loader2 className="h-5 w-5 animate-spin" />}
          Let me in!
        </button>
      </form>
    </Center>
  );
}

function Lobby({
  code, players, me, room, isHost,
}: { code: string; players: Player[]; me: Player; room: Room; isHost: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/r/${code}` : "";

  async function startParty() {
    await supabase
      .from("rooms")
      .update({ phase: "submitting", round: 1, current_challenge_id: null })
      .eq("id", room.id);
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-3xl bg-card-pop p-6 text-card-foreground shadow-pop">
        <h2 className="mb-2 text-2xl font-bold">Scan to join</h2>
        <p className="mb-4 text-sm text-muted-foreground">Or share the code: <b>{code}</b></p>
        <div className="flex justify-center rounded-2xl bg-white p-4">
          <QRCodeSVG value={url} size={200} />
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold text-card-foreground hover:bg-muted/70"
        >
          {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy link</>}
        </button>
      </div>

      <div className="rounded-3xl bg-card-pop p-6 text-card-foreground shadow-pop">
        <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold">
          <Users className="h-6 w-6" /> Players ({players.length})
        </h2>
        <ul className="mb-4 space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm font-bold"
            >
              <span className="truncate">{p.nickname} {p.id === me.id && "(you)"}</span>
              {p.is_host && <Crown className="h-4 w-4 text-secondary" />}
            </li>
          ))}
        </ul>
        {isHost ? (
          <button
            onClick={startParty}
            disabled={players.length < 1}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-xl font-bold text-primary-foreground shadow-tile disabled:opacity-50"
          >
            Start party <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Waiting for the host to start…</p>
        )}
        {players.length < 2 && isHost && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Tip: solo mode works for testing — invite friends for the real party!</p>
        )}
      </div>
    </div>
  );
}

/* ---------- SUBMITTING: every player privately submits one challenge ---------- */

function SubmittingPhase({
  players, me, room, roundChallenges, isHost,
}: {
  players: Player[]; me: Player; room: Room;
  roundChallenges: Challenge[]; isHost: boolean;
}) {
  const mySubmission = roundChallenges.find((c) => c.created_by === me.id);
  const submittedIds = new Set(roundChallenges.map((c) => c.created_by));
  const allSubmitted = players.every((p) => submittedIds.has(p.id));

  // Any client auto-advances when everyone submitted (idempotent)
  useEffect(() => {
    if (!allSubmitted || roundChallenges.length === 0) return;
    if (!isHost) return; // only host triggers to avoid races
    (async () => {
      const first = [...roundChallenges].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      await supabase
        .from("rooms")
        .update({ phase: "performing", current_challenge_id: first.id })
        .eq("id", room.id);
      await supabase.from("challenges").update({ status: "performing" }).eq("id", first.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubmitted]);

  return (
    <div className="space-y-4">
      {!mySubmission ? (
        <SubmitChallengeForm players={players} me={me} room={room} />
      ) : (
        <Card>
          <div className="flex items-center gap-2 text-fun-green">
            <Check className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Submitted!</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Your challenge is hidden until it's its turn 🤫</p>
          <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm italic text-muted-foreground">
            "{mySubmission.description}"
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-secondary" />
          Waiting room — {roundChallenges.length}/{players.length} submitted
        </h3>
        <ul className="space-y-2">
          {players.map((p) => {
            const ok = submittedIds.has(p.id);
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${ok ? "bg-fun-green text-white" : "bg-muted text-card-foreground"}`}
                style={ok ? { textShadow: "0 1px 0 rgba(0,0,0,0.3)" } : {}}
              >
                <span className="truncate">{p.nickname}{p.id === me.id ? " (you)" : ""}</span>
                {ok ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function SubmitChallengeForm({
  players, me, room,
}: { players: Player[]; me: Player; room: Room }) {
  const [description, setDescription] = useState(pickRandomChallenge());
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit() {
    if (selected.length === 0 || !description.trim()) return;
    setBusy(true);
    await supabase.from("challenges").insert({
      room_id: room.id,
      created_by: me.id,
      performer_ids: selected,
      description: description.trim().slice(0, 280),
      status: "pending",
      round: room.round,
    } as any);
    setBusy(false);
  }

  return (
    <Card>
      <h2 className="mb-1 text-3xl font-bold">Your challenge 🤫</h2>
      <p className="mb-4 text-muted-foreground">No one sees it until it's its turn. Pick performers + the dare.</p>

      <p className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Performers</p>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {players.map((p, i) => {
          const colors = ["bg-fun-pink", "bg-fun-yellow", "bg-fun-blue", "bg-fun-green", "bg-fun-orange"];
          const color = colors[i % colors.length];
          const active = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`${color} rounded-xl px-3 py-3 text-left font-bold shadow-tile transition-all ${active ? "scale-95 ring-4 ring-foreground/40" : "hover:translate-y-0.5"}`}
              style={{ color: "white", textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
            >
              {p.nickname}{p.id === me.id ? " (you)" : ""}
              {active && <Check className="mt-1 h-4 w-4" />}
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Challenge</p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        maxLength={280}
        className="w-full rounded-xl border-2 border-border/30 bg-muted px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
        style={{ color: "var(--color-card-foreground)" }}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => setDescription(pickRandomChallenge())}
          className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground"
        >
          <Shuffle className="h-3.5 w-3.5" /> Random
        </button>
        {CHALLENGE_DECK.slice(0, 4).map((c) => (
          <button key={c} onClick={() => setDescription(c)} className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-card-foreground hover:bg-muted/70">
            {c.slice(0, 28)}…
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={busy || selected.length === 0 || !description.trim()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-xl font-bold text-primary-foreground shadow-tile disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Submit secretly
      </button>
    </Card>
  );
}

/* ---------- PERFORMING ---------- */

function PerformingPhase({
  challenge, players, me, room,
}: { challenge: Challenge; players: Player[]; me: Player; room: Room }) {
  const performers = players.filter((p) => challenge.performer_ids.includes(p.id));
  const author = players.find((p) => p.id === challenge.created_by);
  const amPerformer = challenge.performer_ids.includes(me.id);

  async function done() {
    await supabase.from("rooms").update({ phase: "voting" }).eq("id", room.id);
    await supabase.from("challenges").update({ status: "voting" }).eq("id", challenge.id);
  }

  return (
    <Card>
      <p className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Challenge from {author?.nickname ?? "someone"} 🎭
      </p>
      <h2 className="mb-3 flex flex-wrap gap-1 text-2xl font-bold">
        Performers:{" "}
        {performers.map((p) => (
          <span key={p.id} className="rounded-lg bg-primary px-2 py-0.5 text-primary-foreground">{p.nickname}</span>
        ))}
      </h2>
      <p className="rounded-2xl bg-muted px-5 py-6 text-2xl font-bold text-card-foreground">
        {challenge.description}
      </p>
      {amPerformer ? (
        <button onClick={done} className="mt-5 w-full rounded-xl bg-secondary px-4 py-4 text-xl font-bold text-secondary-foreground shadow-tile">
          We're done! Start voting →
        </button>
      ) : (
        <p className="mt-5 text-center text-sm text-muted-foreground">Watch carefully — voting opens when they're done.</p>
      )}
    </Card>
  );
}

/* ---------- VOTING (advances to next pending challenge or to results) ---------- */

function VotingPhase({
  challenge, players, me, room, roundChallenges, votes,
}: {
  challenge: Challenge; players: Player[]; me: Player; room: Room;
  roundChallenges: Challenge[];
  votes: { voter_id: string; rating: number }[];
}) {
  const isPerformer = challenge.performer_ids.includes(me.id);
  const myVote = votes.find((v) => v.voter_id === me.id);
  const eligibleVoters = players.filter((p) => !challenge.performer_ids.includes(p.id));
  const allVoted = eligibleVoters.length > 0 && eligibleVoters.every((p) => votes.some((v) => v.voter_id === p.id));
  const isHost = me.is_host;

  async function vote(rating: number) {
    if (myVote || isPerformer) return;
    await supabase.from("votes").insert({ challenge_id: challenge.id, voter_id: me.id, rating });
  }

  // Auto-finalize when everyone has voted — only host triggers to avoid races
  useEffect(() => {
    if (!allVoted || !isHost) return;
    (async () => {
      const ratings = votes.map((v) => v.rating);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      for (const pid of challenge.performer_ids) {
        const p = players.find((x) => x.id === pid);
        if (!p) continue;
        await supabase.from("players").update({ score: Number(p.score) + avg }).eq("id", pid);
      }
      await supabase.from("challenges").update({ status: "done", avg_rating: avg }).eq("id", challenge.id);

      // Find next pending challenge in this round
      const remaining = roundChallenges
        .filter((c) => c.id !== challenge.id && c.status === "pending")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (remaining.length > 0) {
        const next = remaining[0];
        await supabase.from("rooms").update({ phase: "performing", current_challenge_id: next.id }).eq("id", room.id);
        await supabase.from("challenges").update({ status: "performing" }).eq("id", next.id);
      } else {
        await supabase.from("rooms").update({ phase: "results" }).eq("id", room.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVoted]);

  const pendingCount = roundChallenges.filter((c) => c.status === "pending").length;

  return (
    <Card>
      <p className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Vote 1–5 ⭐ · {pendingCount} more after this
      </p>
      <h2 className="mb-1 text-2xl font-bold">{challenge.description}</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Performed by {challenge.performer_ids.map((id) => players.find((p) => p.id === id)?.nickname).join(", ")}
      </p>

      {isPerformer ? (
        <p className="rounded-xl bg-muted px-4 py-6 text-center font-semibold text-muted-foreground">
          You can't vote for yourself 😉 Waiting for the audience…
        </p>
      ) : myVote ? (
        <p className="rounded-xl bg-fun-green px-4 py-6 text-center text-xl font-bold text-white shadow-tile">
          You gave {myVote.rating} ⭐ — waiting for others…
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const colors = ["bg-fun-orange", "bg-fun-pink", "bg-fun-yellow", "bg-fun-blue", "bg-fun-green"];
            return (
              <button
                key={n}
                onClick={() => vote(n)}
                className={`${colors[n - 1]} flex aspect-square flex-col items-center justify-center rounded-2xl text-3xl font-extrabold text-white shadow-tile transition-transform active:translate-y-1`}
                style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
              >
                {n}
                <Star className="mt-1 h-4 w-4 fill-white" />
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {votes.length} / {eligibleVoters.length} votes in
      </p>
    </Card>
  );
}

/* ---------- RESULTS ---------- */

function ResultsPhase({
  players, me, room, roundChallenges, isHost,
}: {
  players: Player[]; me: Player; room: Room;
  roundChallenges: Challenge[]; isHost: boolean;
}) {
  const ranked = [...players].sort((a, b) => Number(b.score) - Number(a.score));
  const done = roundChallenges.filter((c) => c.status === "done");

  async function nextRound() {
    await supabase
      .from("rooms")
      .update({ phase: "submitting", round: room.round + 1, current_challenge_id: null })
      .eq("id", room.id);
  }

  async function backToLobby() {
    await supabase.from("rooms").update({ phase: "lobby", current_challenge_id: null }).eq("id", room.id);
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Round {room.round} recap</p>
        <ul className="mt-2 space-y-2">
          {done.map((c) => {
            const author = players.find((p) => p.id === c.created_by);
            return (
              <li key={c.id} className="rounded-xl bg-muted px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{c.description}</p>
                  <span className="shrink-0 rounded-lg bg-primary px-2 py-0.5 text-sm font-extrabold text-primary-foreground">
                    {Number(c.avg_rating).toFixed(1)} ⭐
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  by {author?.nickname ?? "?"} · performed by {c.performer_ids.map((id) => players.find((p) => p.id === id)?.nickname).join(", ")}
                </p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-3xl font-bold">
          <Trophy className="h-7 w-7 text-secondary" /> Ranking
        </h2>
        <ol className="space-y-2">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 font-bold shadow-tile ${
                i === 0 ? "bg-secondary text-secondary-foreground"
                  : i === 1 ? "bg-fun-blue text-white"
                  : i === 2 ? "bg-fun-orange text-white"
                  : "bg-muted text-card-foreground"
              }`}
              style={i > 0 && i < 3 ? { textShadow: "0 1px 0 rgba(0,0,0,0.3)" } : {}}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-center">{i + 1}</span>
                <span>{p.nickname}{p.id === me.id ? " (you)" : ""}</span>
              </span>
              <span>{Number(p.score).toFixed(1)} ⭐</span>
            </li>
          ))}
        </ol>

        {isHost ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button onClick={nextRound} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-lg font-bold text-primary-foreground shadow-tile">
              <Mic className="h-5 w-5" /> Next round
            </button>
            <button onClick={backToLobby} className="rounded-xl bg-muted px-4 py-4 text-lg font-bold text-card-foreground shadow-tile">
              Back to lobby
            </button>
          </div>
        ) : (
          <p className="mt-5 text-center text-sm text-muted-foreground">Waiting for the host…</p>
        )}
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-card-pop p-6 text-card-foreground shadow-pop">{children}</div>;
}
