
-- Rooms
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  phase text NOT NULL DEFAULT 'lobby',
  current_challenge_id uuid,
  host_player_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Players
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  is_host boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX players_room_idx ON public.players(room_id);

-- Challenges
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  performer_ids uuid[] NOT NULL DEFAULT '{}',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  avg_rating numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX challenges_room_idx ON public.challenges(room_id);

-- Votes
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Permissive policies (nickname-only party app, no auth)
CREATE POLICY "public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "public write rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "public update rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "public write players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "public update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "public delete players" ON public.players FOR DELETE USING (true);

CREATE POLICY "public read challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "public write challenges" ON public.challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "public update challenges" ON public.challenges FOR UPDATE USING (true);

CREATE POLICY "public read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "public write votes" ON public.votes FOR INSERT WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.challenges REPLICA IDENTITY FULL;
ALTER TABLE public.votes REPLICA IDENTITY FULL;
