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
  EyeOff,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/r/$code")({
  component: RoomPage,
});

type Room = {
  id: string;
  code: string;
  name: string;
  phase: string;
  round: number;
  current_challenge_id: string | null;
  host_player_id: string | null;
};

function challengeIsSecret(challenge: Challenge) {
  return Boolean((challenge as Challenge & { is_secret?: boolean }).is_secret);
}

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
  const participants = players.filter((p) => !p.is_host);
  const roundChallenges = challenges.filter((c) => (c as any).round === r.round);

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className={isHost ? "mx-auto max-w-6xl" : "mx-auto max-w-3xl"}>
        <Header room={r} code={code} me={me} round={r.round} phase={r.phase} onLeave={() => { clearPlayer(code); navigate({ to: "/" }); }} />

        {r.phase === "lobby" && (
          <Lobby code={code} players={participants} me={me} room={r} isHost={isHost} />
        )}
        {r.phase === "submitting" && (
          <SubmittingPhase players={participants} me={me} room={r} roundChallenges={roundChallenges} isHost={isHost} />
        )}
        {r.phase === "performing" && currentChallenge && (
          <PerformingPhase challenge={currentChallenge} players={participants} me={me} room={r} isHost={isHost} />
        )}
        {r.phase === "voting" && currentChallenge && (
          <VotingPhase
            challenge={currentChallenge}
            players={participants}
            me={me}
            room={r}
            roundChallenges={roundChallenges}
            votes={votes.filter((v) => v.challenge_id === currentChallenge.id)}
          />
        )}
        {r.phase === "results" && (
          <ResultsPhase
            players={participants}
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

function Header({ room, code, me, round, phase, onLeave }: { room: Room; code: string; me: Player; round: number; phase: string; onLeave: () => void }) {
  if (me.is_host) {
    return (
      <div className="mb-9 flex items-start justify-between gap-6">
        <div className="flex-1" />

        <div className="flex flex-1 justify-center">
          <div className="relative flex h-[72px] w-[560px] items-center rounded-full bg-[rgba(88,20,119,0.82)] px-8 text-white shadow-[0_7px_0_rgba(74,16,99,0.65)]">
            <div className="min-w-[155px]">
              <p className="text-[13px] font-bold leading-none text-white/70">Game pin</p>
              <p className="mt-1 text-[27px] font-extrabold leading-none tracking-[0.03em]">{code}</p>
            </div>

            {phase !== "lobby" ? (
              <div className="absolute left-1/2 top-1/2 flex h-[98px] w-[98px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[4px] border-[rgba(100,45,129,0.9)] bg-white text-[rgba(40,17,67,1)] shadow-[0_6px_0_rgba(85,31,115,0.6)]">
                <Crown className="mb-[1px] h-6 w-6 fill-secondary text-secondary" />
                <span className="text-[13px] font-bold leading-none">Round</span>
                <span className="mt-[2px] text-[38px] font-extrabold leading-none">{round}</span>
              </div>
            ) : null}

            <div className="ml-auto min-w-[190px] text-left">
              <p className="text-[18px] font-extrabold leading-none">{room.name}</p>
              <p className="mt-[3px] text-[18px] font-extrabold leading-none">{me.nickname} <span className="text-[18px]">👑</span></p>
              <p className="mt-[2px] text-[18px] font-extrabold leading-none text-white/88">Host</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 justify-end pt-1">
          <button
            onClick={onLeave}
            className="rounded-2xl bg-[rgba(113,47,69,0.92)] px-5 py-[10px] text-[17px] font-extrabold text-white shadow-[0_5px_0_rgba(80,30,47,0.7)] transition-colors hover:bg-[rgba(124,54,77,0.96)]"
          >
            <span className="inline-flex items-center gap-2"><LogOut className="h-[18px] w-[18px]" /> Leave</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`rounded-xl ${me.is_host ? "bg-white/14 text-white" : "bg-card-pop text-card-foreground"} px-3 py-1.5 font-bold tracking-widest shadow-tile`}>
          {code}
        </span>
        {phase !== "lobby" && (
          <span className="rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">
            Round {round}
          </span>
        )}
        <span className="text-sm font-semibold text-foreground/80">
          {room.name} · {me.nickname} {me.is_host && <><Crown className="inline h-4 w-4 text-secondary" /> <span className="ml-1">Host</span></>}
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

  if (isHost) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/8 p-8 text-white shadow-pop backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/70">Scan to join</p>
          <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-white/60">Room PIN</p>
              <h2 className="mt-2 text-stroke text-7xl font-extrabold tracking-[0.25em]">{code}</h2>
              <p className="mt-4 text-3xl font-extrabold text-white">{room.name}</p>
              <p className="mt-5 max-w-xl text-lg font-medium text-white/80">
                Players join on their phones, pick a nickname, and wait for the first secret challenge round.
              </p>
            </div>
            <div className="rounded-[2rem] bg-white p-5 shadow-pop">
              <QRCodeSVG value={url} size={240} />
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-black/15 px-4 py-3 text-sm font-semibold text-white/70">
            {url}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-white/14 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"
          >
            {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy invite link</>}
          </button>
        </div>

        <div className="rounded-[2rem] bg-card-pop p-8 text-card-foreground shadow-pop">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-3xl font-bold">
              <Users className="h-7 w-7" /> Players
            </h2>
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-extrabold text-primary-foreground">
              {players.length}
            </span>
          </div>
          <ul className="mt-5 space-y-3">
            {players.map((p, index) => (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-white shadow-tile ${
                  ["bg-fun-pink", "bg-fun-yellow text-card-foreground", "bg-fun-blue", "bg-fun-green", "bg-fun-orange"][index % 5]
                }`}
                style={{ textShadow: index % 5 === 1 ? undefined : "0 1px 0 rgba(0,0,0,0.25)" }}
              >
                <span className="truncate">{p.nickname}</span>
                <span className="text-sm uppercase tracking-wider opacity-80">Ready</span>
              </li>
            ))}
          </ul>
          <button
            onClick={startParty}
            disabled={players.length < 1}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-5 text-2xl font-extrabold text-primary-foreground shadow-tile disabled:opacity-50"
          >
            Start party <ArrowRight className="h-6 w-6" />
          </button>
          {players.length < 2 && (
            <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">Invite at least two players for the full party flow.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-3xl bg-card-pop p-6 text-card-foreground shadow-pop">
        <h2 className="mb-2 text-2xl font-bold">Scan to join</h2>
        <p className="mb-1 text-lg font-bold text-card-foreground">{room.name}</p>
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
          <p className="mt-2 text-center text-xs text-muted-foreground">Need at least 2 players to feel like a real party.</p>
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
  const submittedIds = new Set(roundChallenges.map((c) => c.created_by));
  const allSubmitted = players.length > 0 && players.every((p) => submittedIds.has(p.id));

  // Auto-advance when every participant submitted. Host triggers to avoid races.
  useEffect(() => {
    if (!allSubmitted || roundChallenges.length === 0) return;
    if (!isHost) return;
    (async () => {
      const first = [...roundChallenges].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      if (!first) return;
      await supabase
        .from("rooms")
        .update({ phase: "performing", current_challenge_id: first.id })
        .eq("id", room.id);
      await supabase.from("challenges").update({ status: "performing" }).eq("id", first.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubmitted, isHost, room.id, roundChallenges.length]);

  if (isHost) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/8 p-10 text-white shadow-pop backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/70">Round {room.round}</p>
          <h2 className="mt-4 text-6xl font-extrabold leading-none">Everyone is sending a secret challenge</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-[2rem] bg-black/15 p-8 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/60">Submitted</p>
              <p className="mt-3 text-stroke text-8xl font-extrabold text-secondary">{roundChallenges.length}</p>
            </div>
            <div className="rounded-[2rem] bg-black/15 p-8 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/60">Remaining</p>
              <p className="mt-3 text-stroke text-8xl font-extrabold">{Math.max(players.length - roundChallenges.length, 0)}</p>
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-primary px-6 py-5 text-center text-2xl font-extrabold text-primary-foreground shadow-tile">
            {allSubmitted ? "All challenges are in. Starting now..." : "Waiting for the last players"}
          </div>
        </div>

        <div className="rounded-[2rem] bg-card-pop p-8 text-card-foreground shadow-pop">
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-secondary" />
            Player status
          </h3>
          <ul className="space-y-3">
            {players.map((p) => {
              const ok = submittedIds.has(p.id);
              return (
                <li
                  key={p.id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-4 text-base font-bold ${ok ? "bg-fun-green text-white" : "bg-muted text-card-foreground"}`}
                  style={ok ? { textShadow: "0 1px 0 rgba(0,0,0,0.3)" } : {}}
                >
                  <span className="truncate">{p.nickname}</span>
                  {ok ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  const mySubmission = roundChallenges.find((c) => c.created_by === me.id);

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
  const [isSecret, setIsSecret] = useState(false);
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
      is_secret: isSecret,
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
              {p.nickname}
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
        type="button"
        onClick={() => setIsSecret((current) => !current)}
        className={isSecret
          ? "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-card-foreground px-4 py-3 text-sm font-bold text-white shadow-tile"
          : "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-bold text-card-foreground shadow-tile"}
      >
        <EyeOff className="h-4 w-4" />
        {isSecret ? "This is a secret challenge" : "Make this a secret challenge"}
      </button>

      <button
        onClick={submit}
        disabled={busy || selected.length === 0 || !description.trim()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-xl font-bold text-primary-foreground shadow-tile disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Submit
      </button>
    </Card>
  );
}

/* ---------- PERFORMING ---------- */

function PerformingPhase({
  challenge, players, me, room,
  isHost,
}: { challenge: Challenge; players: Player[]; me: Player; room: Room; isHost: boolean }) {
  const performers = players.filter((p) => challenge.performer_ids.includes(p.id));
  const author = players.find((p) => p.id === challenge.created_by);
  const amPerformer = challenge.performer_ids.includes(me.id);
  const isSecret = challengeIsSecret(challenge);
  const shouldHideFromViewer = isSecret && !amPerformer;
  const visibleDescription = shouldHideFromViewer ? "Secret challenge" : challenge.description;

  async function done() {
    await supabase.from("rooms").update({ phase: "voting" }).eq("id", room.id);
    await supabase.from("challenges").update({ status: "voting" }).eq("id", challenge.id);
  }

  if (isHost) {
    return (
      <div className="mx-auto max-w-[1120px] rounded-[2rem] bg-transparent text-[rgba(43,19,74,1)]">
        <div className="rounded-[1.85rem] border-[5px] border-[rgba(109,57,184,0.95)] bg-white px-8 pb-8 pt-7 shadow-[0_13px_0_rgba(79,27,126,0.58)]">
          <div className="mx-auto max-w-[960px] rounded-[1.7rem] border-[5px] border-[rgba(255,43,123,0.98)] bg-white px-8 py-10 text-center shadow-[8px_8px_0_rgba(99,45,162,0.8)]">
            {shouldHideFromViewer ? (
              <div className="flex min-h-[184px] flex-col items-center justify-center gap-3">
                <EyeOff className="h-14 w-14 text-[rgba(61,31,112,1)]" />
                <p className="text-[52px] font-extrabold leading-[1.02] tracking-[-0.04em]">Secret challenge</p>
              </div>
            ) : (
              <p className="mx-auto max-w-[760px] text-[58px] font-extrabold leading-[0.98] tracking-[-0.05em]">
                {visibleDescription}
              </p>
            )}
          </div>

          <div className="mt-14 grid items-center gap-8 lg:grid-cols-[320px_120px_320px] lg:justify-center">
            <div className="relative rounded-[2rem] border-[4px] border-[rgba(85,46,130,0.92)] bg-white px-8 py-6 shadow-[0_7px_0_rgba(84,38,130,0.65)]">
              <div className="absolute left-[22px] top-[-24px] h-0 w-0 border-x-[14px] border-b-[24px] border-x-transparent border-b-white drop-shadow-[0_-2px_0_rgba(85,46,130,0.92)]" />
              <div className="flex items-center gap-4 pr-6">
                <div className="absolute -left-7 top-1/2 flex h-[84px] w-[84px] -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[rgba(85,46,130,0.92)] bg-white text-[46px] shadow-[0_6px_0_rgba(84,38,130,0.45)]">
                  🥳
                </div>
                <div>
                  <p className="pl-14 text-[15px] font-extrabold uppercase tracking-[0.14em] text-[rgba(117,108,138,1)]">From</p>
                  <p className="pl-14 text-[44px] font-extrabold leading-none">{author?.nickname ?? "Someone"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <svg width="108" height="72" viewBox="0 0 108 72" fill="none" aria-hidden="true">
                <path d="M12 36C12 27.2 19.2 20 28 20H56" stroke="rgb(43 20 84)" strokeWidth="6" strokeLinecap="round"/>
                <path d="M12 36C12 44.8 19.2 52 28 52H56" stroke="rgb(43 20 84)" strokeWidth="6" strokeLinecap="round"/>
                <path d="M48 12L76 36L48 60" stroke="rgb(43 20 84)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="relative rounded-[2rem] border-[4px] border-[rgba(85,46,130,0.92)] bg-white px-8 py-6 shadow-[0_7px_0_rgba(84,38,130,0.65)]">
              <div className="absolute right-[22px] top-[-24px] h-0 w-0 border-x-[14px] border-b-[24px] border-x-transparent border-b-white drop-shadow-[0_-2px_0_rgba(85,46,130,0.92)]" />
              <div className="flex items-center justify-between gap-4 pl-6">
                <div className="min-w-0 text-right">
                  <p className="pr-14 text-[15px] font-extrabold uppercase tracking-[0.14em] text-[rgba(117,108,138,1)]">To</p>
                  <p className="truncate pr-14 text-[44px] font-extrabold leading-none">{performers.map((p) => p.nickname).join(" + ")}</p>
                </div>
                <div className="absolute -right-7 top-1/2 flex h-[84px] w-[84px] -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[rgba(85,46,130,0.92)] bg-white text-[46px] shadow-[0_6px_0_rgba(84,38,130,0.45)]">
                  🎭
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className={`mb-5 grid gap-3 ${isHost ? "lg:grid-cols-2" : "sm:grid-cols-2"}`}>
        <div className="rounded-2xl bg-muted px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">From</p>
          <p className="mt-2 text-2xl font-extrabold text-card-foreground">{author?.nickname ?? "Someone"}</p>
        </div>
        <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">To</p>
          <p className="mt-2 text-2xl font-extrabold">{performers.map((p) => p.nickname).join(" + ")}</p>
        </div>
      </div>
      <div className={`rounded-2xl ${isSecret && !amPerformer ? "bg-card-foreground text-white" : "bg-muted text-card-foreground"} px-5 py-6`}>
        {isSecret && !amPerformer ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <EyeOff className="h-12 w-12" />
            <p className={`${isHost ? "text-5xl leading-tight" : "text-2xl"} font-extrabold`}>Secret challenge</p>
            <p className="text-base font-semibold text-white/75">Only the performers can see the exact challenge.</p>
          </div>
        ) : (
          <p className={`${isHost ? "text-5xl leading-tight" : "text-2xl"} font-bold`}>
            {visibleDescription}
          </p>
        )}
      </div>
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
  const isSecret = challengeIsSecret(challenge);
  const shouldHideFromViewer = isSecret && !isPerformer;

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
  const voteProgress = eligibleVoters.length > 0 ? Math.round((votes.length / eligibleVoters.length) * 100) : 0;

  return (
    <Card>
      <p className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Vote 1–5 ⭐ · {pendingCount} more after this
      </p>
      <div className={`mb-5 grid gap-3 ${isHost ? "lg:grid-cols-2" : "sm:grid-cols-2"}`}>
        <div className="rounded-2xl bg-muted px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">From</p>
          <p className="mt-2 text-2xl font-extrabold text-card-foreground">{players.find((p) => p.id === challenge.created_by)?.nickname ?? "Someone"}</p>
        </div>
        <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">To</p>
          <p className="mt-2 text-2xl font-extrabold">{challenge.performer_ids.map((id) => players.find((p) => p.id === id)?.nickname).join(" + ")}</p>
        </div>
      </div>
      <div className={`mb-5 rounded-2xl ${shouldHideFromViewer ? "bg-card-foreground text-white" : "bg-muted text-card-foreground"} px-5 py-6`}>
        {shouldHideFromViewer ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <EyeOff className="h-10 w-10" />
            <p className={`${isHost ? "text-4xl" : "text-2xl"} font-extrabold`}>Secret challenge</p>
          </div>
        ) : (
          <h2 className={`font-bold ${isHost ? "text-5xl" : "text-2xl"}`}>{challenge.description}</h2>
        )}
      </div>

      {isHost ? (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/8 px-8 py-10 text-white shadow-pop backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/65">Audience voting</p>
            <p className="mt-4 text-6xl font-extrabold">{votes.length}<span className="text-3xl text-white/70">/{eligibleVoters.length}</span></p>
            <div className="mt-6 h-6 overflow-hidden rounded-full bg-black/20">
              <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${voteProgress}%` }} />
            </div>
            <p className="mt-4 text-2xl font-semibold text-white/75">{isSecret ? "Phones are scoring a secret challenge" : "Phones are scoring this performance right now"}</p>
          </div>
          <div className="rounded-[2rem] bg-primary px-8 py-10 text-center text-primary-foreground shadow-tile">
            <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-80">Live progress</p>
            <p className="mt-4 text-stroke text-8xl font-extrabold">{voteProgress}%</p>
          </div>
        </div>
      ) : isPerformer ? (
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
            const isSecret = challengeIsSecret(c);
            return (
              <li key={c.id} className="rounded-xl bg-muted px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{isSecret ? `Secret challenge for ${c.performer_ids.map((id) => players.find((p) => p.id === id)?.nickname).join(" + ")}` : c.description}</p>
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
        <h2 className={`mb-4 flex items-center gap-2 font-bold ${isHost ? "text-5xl" : "text-3xl"}`}>
          <Trophy className="h-7 w-7 text-secondary" /> Ranking
        </h2>
        <ol className={`space-y-2 ${isHost ? "lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0" : ""}`}>
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-xl px-4 ${isHost ? "py-5 text-xl" : "py-3"} font-bold shadow-tile ${
                i === 0 ? "bg-secondary text-secondary-foreground"
                  : i === 1 ? "bg-fun-blue text-white"
                  : i === 2 ? "bg-fun-orange text-white"
                  : "bg-muted text-card-foreground"
              }`}
              style={i > 0 && i < 3 ? { textShadow: "0 1px 0 rgba(0,0,0,0.3)" } : {}}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-center">{i + 1}</span>
                <span>{p.nickname}{p.id === me.id && !me.is_host ? " (you)" : ""}</span>
              </span>
              <span>{Number(p.score).toFixed(1)} ⭐</span>
            </li>
          ))}
        </ol>

        {isHost ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={nextRound} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-5 text-2xl font-bold text-primary-foreground shadow-tile">
              <Mic className="h-5 w-5" /> Next round
            </button>
            <button onClick={backToLobby} className="rounded-xl bg-muted px-4 py-5 text-2xl font-bold text-card-foreground shadow-tile">
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
