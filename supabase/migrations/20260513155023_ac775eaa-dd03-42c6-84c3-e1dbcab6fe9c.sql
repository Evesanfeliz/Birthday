ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS round integer NOT NULL DEFAULT 1;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS round integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_challenges_room_round ON public.challenges(room_id, round);