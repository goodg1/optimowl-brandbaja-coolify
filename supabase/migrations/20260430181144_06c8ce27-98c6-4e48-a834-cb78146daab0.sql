-- =========================
-- media_assets
-- =========================
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  uploaded_by UUID,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_brand ON public.media_assets(brand_id, created_at DESC);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brand media"
  ON public.media_assets FOR SELECT
  TO authenticated
  USING (public.has_brand_access(auth.uid(), brand_id));

CREATE POLICY "Brand members can upload media"
  ON public.media_assets FOR INSERT
  TO authenticated
  WITH CHECK (public.has_brand_access(auth.uid(), brand_id) AND uploaded_by = auth.uid());

CREATE POLICY "Uploader or admin/manager can delete media"
  ON public.media_assets FOR DELETE
  TO authenticated
  USING (
    public.has_brand_access(auth.uid(), brand_id) AND (
      uploaded_by = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- =========================
-- post_metrics
-- =========================
CREATE TABLE public.post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  platform platform_type NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

CREATE INDEX idx_post_metrics_post ON public.post_metrics(post_id);

ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for accessible posts"
  ON public.post_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_metrics.post_id AND public.has_brand_access(auth.uid(), p.brand_id)
    )
  );

-- =========================
-- notifications
-- =========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  post_id UUID,
  brand_id UUID,
  actor_id UUID,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow insert from authenticated; trigger uses SECURITY DEFINER and explicit inserts are not exposed to the client
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =========================
-- Notification trigger on post status change
-- =========================
CREATE OR REPLACE FUNCTION public.notify_on_post_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  brand_name TEXT;
  actor UUID := auth.uid();
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT name INTO brand_name FROM public.brands WHERE id = NEW.brand_id;

  -- pending_manager → notify admins + managers with brand access
  IF NEW.status = 'pending_manager' THEN
    INSERT INTO public.notifications (user_id, type, post_id, brand_id, actor_id, message)
    SELECT DISTINCT ur.user_id, 'approval_requested', NEW.id, NEW.brand_id, actor,
           'A post needs manager approval in ' || COALESCE(brand_name, 'a brand')
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'manager')
      AND public.has_brand_access(ur.user_id, NEW.brand_id)
      AND ur.user_id <> COALESCE(actor, '00000000-0000-0000-0000-000000000000'::uuid);

  -- pending_client → notify clients with brand access
  ELSIF NEW.status = 'pending_client' THEN
    INSERT INTO public.notifications (user_id, type, post_id, brand_id, actor_id, message)
    SELECT DISTINCT ur.user_id, 'approval_requested', NEW.id, NEW.brand_id, actor,
           'A post needs client approval in ' || COALESCE(brand_name, 'a brand')
    FROM public.user_roles ur
    WHERE ur.role = 'client'
      AND public.has_brand_access(ur.user_id, NEW.brand_id)
      AND ur.user_id <> COALESCE(actor, '00000000-0000-0000-0000-000000000000'::uuid);

  -- approved/scheduled/published/rejected → notify creator
  ELSIF NEW.status IN ('approved', 'scheduled', 'published', 'rejected') AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, post_id, brand_id, actor_id, message)
    VALUES (
      NEW.created_by,
      CASE WHEN NEW.status = 'rejected' THEN 'approval_rejected' ELSE 'approval_approved' END,
      NEW.id, NEW.brand_id, actor,
      'Your post in ' || COALESCE(brand_name, 'a brand') || ' was ' || replace(NEW.status::text, '_', ' ')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_post_status_change
AFTER UPDATE OF status ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_post_status_change();

-- =========================
-- Realtime
-- =========================
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;