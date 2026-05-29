-- Add x to platform_type enum
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'x';

-- Extend brand_accounts
ALTER TABLE public.brand_accounts
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scopes TEXT[],
  ADD COLUMN IF NOT EXISTS auto_publish_enabled BOOLEAN DEFAULT TRUE;

-- New enum for per-platform attempt status
DO $$ BEGIN
  CREATE TYPE platform_attempt_status AS ENUM (
    'pending', 'processing', 'published', 'needs_manual', 'failed', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- post_platform_attempts table
CREATE TABLE IF NOT EXISTS public.post_platform_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  platform platform_type NOT NULL,
  content_override TEXT,
  hashtags_override TEXT[],
  status platform_attempt_status NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  external_post_id TEXT,
  external_url TEXT,
  published_at TIMESTAMPTZ,
  posted_manually BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_ppa_post ON public.post_platform_attempts(post_id);
CREATE INDEX IF NOT EXISTS idx_ppa_status ON public.post_platform_attempts(status);

ALTER TABLE public.post_platform_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View attempts for accessible posts"
  ON public.post_platform_attempts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.has_brand_access(auth.uid(), p.brand_id)));

CREATE POLICY "Insert attempts for accessible posts"
  ON public.post_platform_attempts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.has_brand_access(auth.uid(), p.brand_id)));

CREATE POLICY "Update attempts for accessible posts"
  ON public.post_platform_attempts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.has_brand_access(auth.uid(), p.brand_id)));

CREATE POLICY "Admins/managers delete attempts"
  ON public.post_platform_attempts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id
    AND public.has_brand_access(auth.uid(), p.brand_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))));

CREATE TRIGGER ppa_updated_at
  BEFORE UPDATE ON public.post_platform_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_platform_attempts;

-- Enable cron + net for scheduler
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;