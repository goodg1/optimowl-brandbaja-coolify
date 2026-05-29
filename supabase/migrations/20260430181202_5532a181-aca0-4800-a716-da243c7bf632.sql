-- Storage policies for the existing public 'media' bucket.
-- Files are uploaded under path: {brand_id}/{uuid}.{ext}

-- Public read (bucket is public, but explicit policy for clarity)
CREATE POLICY "Public can read media files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Authenticated users with brand access can upload to that brand's folder
CREATE POLICY "Brand members can upload media files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND public.has_brand_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- Owner can delete; admins/managers with brand access can also delete
CREATE POLICY "Owner or admin/manager can delete media files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media' AND (
      owner = auth.uid()
      OR (
        public.has_brand_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
        AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
      )
    )
  );