-- Create server-side role verification function to prevent client-side bypass
CREATE OR REPLACE FUNCTION public.verify_user_role()
RETURNS TABLE (role app_role, is_valid boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role, true as is_valid
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_user_role() TO authenticated;

COMMENT ON FUNCTION public.verify_user_role() IS 'Server-side role verification to prevent client-side authorization bypass';
