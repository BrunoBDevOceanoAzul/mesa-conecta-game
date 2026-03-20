
-- Allow GMs to delete their own mesas
CREATE POLICY "GMs can delete own mesas"
ON public.mesas
FOR DELETE
TO authenticated
USING (gm_id = auth.uid());

-- Allow admins/advisors to delete any mesa
CREATE POLICY "Admins can delete any mesa"
ON public.mesas
FOR DELETE
TO authenticated
USING (public.is_super_user(auth.uid()));
