import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, PartyPopper, QrCode, Star, Trophy } from "lucide-react";

import dareTiktok from "@/assets/dare-tiktok.jpg";
import dareSalsa from "@/assets/dare-salsa.jpg";
import dareDuet from "@/assets/dare-duet.jpg";
import dareChoreo from "@/assets/dare-choreo.jpg";
import dareCharades from "@/assets/dare-charades.jpg";
import dareDare from "@/assets/dare-dare.jpg";
import dareTruth from "@/assets/dare-truth.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Friendzy — Dare your friends, perform, vote" },
      {
        name: "description",
        content:
          "Friendzy is a real-time party game. Invite one friend or everyone to take on a challenge — sing, dance, act — then vote on the performance. Built for birthdays and chaos.",
      },
      { property: "og:title", content: "Friendzy — Dare your friends, perform, vote" },
      {
        property: "og:description",
        content:
          "Invite one friend or everyone to take on a challenge. Perform together, vote, climb the ranking.",
      },
    ],
  }),
  component: LandingPage,
});

type Dare = { image: string; tag: string; text: string };

const EXAMPLES: Dare[] = [
  { image: dareTiktok, tag: "1 friend", text: "Make a TikTok with you" },
  { image: dareSalsa, tag: "1 friend", text: "Dance salsa with you" },
  { image: dareDuet, tag: "1 friend", text: "Sing a duet" },
  { image: dareChoreo, tag: "Everyone", text: "Make a choreography together" },
  { image: dareCharades, tag: "1 friend", text: "Act out a movie — others guess" },
  { image: dareDare, tag: "1 friend", text: "Do a dare together" },
  { image: dareTruth, tag: "Everyone", text: "Play one round of Truth or Dare" },
];

const STEPS = [
  { icon: PartyPopper, title: "Create a room", text: "The host opens a room in seconds — no signup, just a nickname." },
  { icon: QrCode, title: "Scan the QR", text: "Friends join from their phones by scanning the room's QR code." },
  { icon: Sparkles, title: "Send a dare", text: "Each round, every player sends one secret dare for someone — or everyone." },
  { icon: Star, title: "Perform & vote", text: "When the moment comes, the dare is revealed. Perform, then everyone votes 1–5 stars." },
  { icon: Trophy, title: "Crown the champion", text: "Live ranking after every round. Highest score wins the night." },
];

function MarqueeRow({
  items,
  direction,
}: {
  items: Dare[];
  direction: "left" | "right";
}) {
  const loop = [...items, ...items];
  return (
    <div className="flex w-max min-w-full">
      <div
        className={`flex w-max shrink-0 gap-5 pr-5 ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
      >
        {loop.map((ex, i) => (
          <figure
            key={`${ex.text}-${i}`}
            className="group relative w-[260px] shrink-0 overflow-hidden rounded-2xl shadow-pop sm:w-[300px]"
          >
            <img
              src={ex.image}
              alt={ex.text}
              loading="lazy"
              width={512}
              height={640}
              className="h-[340px] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-[380px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white">
              <span className="mb-2 inline-block rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-tile">
                {ex.tag}
              </span>
              <p className="text-base font-semibold leading-snug sm:text-lg">{ex.text}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <main className="min-h-screen">
      <section className="px-6 pt-16 pb-20 text-center sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-card-pop px-4 py-1.5 text-sm font-bold text-card-foreground shadow-pop">
            <PartyPopper className="h-4 w-4 text-primary" />
            Real-time party game
          </div>
          <h1 className="text-stroke text-7xl tracking-tight text-foreground sm:text-8xl md:text-9xl">
            Friendzy
          </h1>
          <p className="mt-6 text-xl font-semibold text-foreground/90 sm:text-2xl">
            Dare a friend. Or dare <em>everyone</em>. Perform together. Then vote.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium text-foreground/75 sm:text-lg">
            Send a dare to one person, two, or the whole room. They take it on
            with you — or for you — and the rest of the party rates the show.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/play"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-5 text-xl font-bold text-primary-foreground shadow-tile transition-transform hover:translate-y-0.5 active:translate-y-1"
            >
              <Sparkles className="h-5 w-5" /> Start a party
            </Link>
            <Link
              to="/play"
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-8 py-5 text-xl font-bold text-accent-foreground shadow-tile transition-transform hover:translate-y-0.5 active:translate-y-1"
            >
              <QrCode className="h-5 w-5" /> Join with a code
            </Link>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground/60">
            No signup. Just a nickname and a phone.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto mb-10 max-w-5xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card-pop px-4 py-1.5 text-sm font-bold text-card-foreground shadow-pop">
            <Sparkles className="h-4 w-4 text-primary" />
            Endless ideas
          </div>
          <h2 className="text-stroke text-5xl tracking-tight text-foreground sm:text-6xl">
            What can you dare?
          </h2>
          <p className="mt-3 text-lg font-semibold text-foreground/80">
            Anything goes. Hover to slow it down.
          </p>
        </div>

        <div className="marquee-pause space-y-5 overflow-hidden mask-fade-x">
          <MarqueeRow items={EXAMPLES} direction="left" />
          <MarqueeRow items={[...EXAMPLES].reverse()} direction="right" />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-stroke text-5xl tracking-tight text-foreground sm:text-6xl">
              How it works
            </h2>
          </div>
          <ol className="space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.title}
                  className="flex items-start gap-4 rounded-2xl bg-card-pop p-5 text-card-foreground shadow-pop"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-tile">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 text-2xl tracking-tight">
                      <Icon className="h-5 w-5 text-primary" />
                      {s.title}
                    </h3>
                    <p className="mt-1 text-base font-medium text-card-foreground/75">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="px-6 pb-24 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl bg-card-pop p-10 text-card-foreground shadow-pop">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="text-4xl tracking-tight sm:text-5xl">Ready to make memories?</h2>
          <p className="mt-3 text-base font-medium text-card-foreground/75 sm:text-lg">
            Grab your friends, open a room, and let the chaos begin.
          </p>
          <Link
            to="/play"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-5 text-xl font-bold text-primary-foreground shadow-tile transition-transform hover:translate-y-0.5 active:translate-y-1"
          >
            <PartyPopper className="h-5 w-5" /> Start the party
          </Link>
        </div>
        <p className="mt-8 text-sm font-medium text-foreground/70">
          Built for birthdays 🎂 and chaos
        </p>
      </section>
    </main>
  );
}
