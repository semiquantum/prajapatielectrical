-- ============================================
-- PRAJAPATI ELECTRICAL — Migration V2
-- Goal: Fix signup role assignments safely, update RLS without data loss.
-- ============================================

-- ── 1. Fix handle_new_user trigger for secure Role Assignment ──
-- Allow partners to sign up with their requested role, but block admin escalation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  safe_role TEXT;
BEGIN
  -- Extract requested role from metadata
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  -- Validate role: Only allow self-signup for these roles. Admin/Owner/Manager must be created by an existing Admin.
  IF requested_role IN ('customer', 'employee', 'distributor', 'dealer', 'retailer', 'franchise_partner', 'vendor') THEN
    safe_role := requested_role;
  ELSE
    safe_role := 'customer'; -- Default fallback
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    safe_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 2. Add Missing Indexes for Performance ──
-- Ensuring relationships are indexed for faster queries.
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ── 3. RLS Refinements ──
-- Adding strict checks to prevent cross-tenant data leaks in business tables.

-- Drop any potentially insecure policies if they exist (using IF EXISTS is not natively supported for DROP POLICY, so we replace them)
-- By recreating policies, we ensure they enforce exact auth constraints.

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()) 
  OR public.is_admin_or_staff(auth.uid())
);

-- Ensure Leads can only be seen by admins or assigned employees
DROP POLICY IF EXISTS "Admin/Manager can manage leads" ON public.leads;
CREATE POLICY "Admin/Manager/Assigned can manage leads" 
ON public.leads FOR ALL 
USING (
  public.is_admin_or_staff(auth.uid()) OR 
  assigned_employee_id = auth.uid()
);

-- ── 4. Verify/Create Base Business Records Automatically (Optional Enhancement) ──
-- When a user is inserted into profiles with a specific B2B role, create a placeholder record for them to fill out later.
CREATE OR REPLACE FUNCTION public.handle_business_record()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'customer' THEN
    INSERT INTO public.customers (id, company_name) VALUES (NEW.id, NEW.full_name) ON CONFLICT DO NOTHING;
  ELSIF NEW.role = 'employee' THEN
    INSERT INTO public.employees (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSIF NEW.role = 'distributor' THEN
    INSERT INTO public.distributors (id, company_name, territory) VALUES (NEW.id, NEW.full_name, 'Pending') ON CONFLICT DO NOTHING;
  ELSIF NEW.role = 'dealer' THEN
    INSERT INTO public.dealers (id, company_name) VALUES (NEW.id, NEW.full_name) ON CONFLICT DO NOTHING;
  ELSIF NEW.role = 'retailer' THEN
    INSERT INTO public.retailers (id, company_name) VALUES (NEW.id, NEW.full_name) ON CONFLICT DO NOTHING;
  ELSIF NEW.role = 'franchise_partner' THEN
    INSERT INTO public.franchise_partners (id, company_name, store_location) VALUES (NEW.id, NEW.full_name, 'Pending') ON CONFLICT DO NOTHING;
  ELSIF NEW.role = 'vendor' THEN
    INSERT INTO public.vendors (id, company_name) VALUES (NEW.id, NEW.full_name) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_business_record();
