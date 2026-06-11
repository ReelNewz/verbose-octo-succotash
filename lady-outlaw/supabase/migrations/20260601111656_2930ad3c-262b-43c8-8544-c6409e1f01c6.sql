
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

DROP POLICY IF EXISTS "Article images are publicly readable" ON storage.objects;
CREATE POLICY "Article images readable by filename"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images' AND auth.role() = 'anon' IS NOT NULL);
