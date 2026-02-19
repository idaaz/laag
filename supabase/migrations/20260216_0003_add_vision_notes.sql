-- Advanced notes tied to project vision and decision tracking
CREATE TABLE IF NOT EXISTS public.vision_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 180),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  note_type TEXT NOT NULL DEFAULT 'idea'
    CHECK (note_type IN ('thought', 'idea', 'decision', 'risk', 'question', 'milestone', 'insight')),
  vision_pillar TEXT NOT NULL DEFAULT 'product'
    CHECK (vision_pillar IN ('product', 'growth', 'discipline', 'health', 'relationships', 'learning', 'operations')),
  horizon TEXT NOT NULL DEFAULT 'this_week'
    CHECK (horizon IN ('today', 'this_week', 'this_month', 'quarter', 'long_term')),
  impact_score INTEGER NOT NULL DEFAULT 5 CHECK (impact_score BETWEEN 1 AND 10),
  effort_score INTEGER NOT NULL DEFAULT 5 CHECK (effort_score BETWEEN 1 AND 10),
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  review_date DATE,
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_vision_notes_user_updated
  ON public.vision_notes (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vision_notes_user_review_date
  ON public.vision_notes (user_id, review_date)
  WHERE archived = false AND review_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vision_notes_user_pinned
  ON public.vision_notes (user_id, pinned, updated_at DESC)
  WHERE archived = false AND pinned = true;

CREATE INDEX IF NOT EXISTS idx_vision_notes_tags_gin
  ON public.vision_notes USING GIN (tags);

ALTER TABLE public.vision_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vision_notes_select_own ON public.vision_notes;
CREATE POLICY vision_notes_select_own
  ON public.vision_notes
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS vision_notes_insert_own ON public.vision_notes;
CREATE POLICY vision_notes_insert_own
  ON public.vision_notes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS vision_notes_update_own ON public.vision_notes;
CREATE POLICY vision_notes_update_own
  ON public.vision_notes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS vision_notes_delete_own ON public.vision_notes;
CREATE POLICY vision_notes_delete_own
  ON public.vision_notes
  FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS vision_notes_updated_at ON public.vision_notes;
CREATE TRIGGER vision_notes_updated_at
BEFORE UPDATE ON public.vision_notes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
