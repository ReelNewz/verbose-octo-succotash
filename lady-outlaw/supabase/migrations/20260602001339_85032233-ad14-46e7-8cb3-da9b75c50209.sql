
-- Resources catalog
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'General',
  description text,
  storage_path text,
  file_name text,
  content_type text,
  size_bytes bigint,
  gated boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published resources are public"
  ON public.resources FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins view all resources"
  ON public.resources FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage resources"
  ON public.resources FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER resources_set_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_resources_published ON public.resources(published) WHERE published = true;
CREATE INDEX idx_resources_category ON public.resources(category);

-- Download tokens
CREATE TABLE public.download_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  email text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  max_uses integer NOT NULL DEFAULT 3,
  used_count integer NOT NULL DEFAULT 0,
  created_ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.download_tokens TO service_role;
GRANT SELECT ON public.download_tokens TO authenticated;

ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view download tokens"
  ON public.download_tokens FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_download_tokens_resource ON public.download_tokens(resource_id);
CREATE INDEX idx_download_tokens_expires ON public.download_tokens(expires_at);

-- Download events (audit log)
CREATE TABLE public.download_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.download_tokens(id) ON DELETE SET NULL,
  resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
  email text,
  event text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.download_events TO service_role;
GRANT SELECT ON public.download_events TO authenticated;

ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view download events"
  ON public.download_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_download_events_resource ON public.download_events(resource_id);
CREATE INDEX idx_download_events_created ON public.download_events(created_at DESC);

-- Private resource-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-files', 'resource-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read resource files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resource-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins upload resource files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resource-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update resource files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete resource files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-files' AND has_role(auth.uid(), 'admin'::app_role));
