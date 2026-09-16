CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'owner', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
