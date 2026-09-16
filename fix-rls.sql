-- =======================================================
-- ULTIMATE FIX FOR INFINITE RECURSION IN PROFILES
-- Run this entire script in the Supabase SQL Editor
-- =======================================================

-- 1. Drop the old recursive policies completely
DROP POLICY IF EXISTS "Admin/Manager/Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin/Manager/Owner can update all profiles" ON public.profiles;

-- 2. Use a secure metadata check instead of querying the table again to completely eliminate the infinite loop
CREATE POLICY "Admin/Manager/Owner can view all profiles"
  ON public.profiles FOR SELECT
  USING ( 
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'owner', 'manager') 
  );

CREATE POLICY "Admin/Manager/Owner can update all profiles"
  ON public.profiles FOR UPDATE
  USING ( 
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'owner', 'manager') 
  );
