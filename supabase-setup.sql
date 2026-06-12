-- ============================================
-- PRAJAPATI ELECTRICAL — Supabase Database Setup
-- Run this entire script in the Supabase SQL Editor
-- ============================================

-- ── 1. PROFILES TABLE WITH EXPANDED ROLES ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (
    role IN (
      'super_admin', 'admin', 'owner', 'manager', 'employee', 
      'customer', 'distributor', 'dealer', 'retailer', 
      'franchise_partner', 'vendor'
    )
  ),
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin/Manager/Owner can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'manager')
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. B2B PARTNERS & EMPLOYEES TABLES ──

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'corporate')),
  company_name TEXT,
  gstin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  designation TEXT DEFAULT 'Technician',
  department TEXT DEFAULT 'Service',
  attendance_status TEXT DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'on_leave')),
  salary_slip_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Distributors Table
CREATE TABLE IF NOT EXISTS public.distributors (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  gstin TEXT,
  territory TEXT NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;

-- Dealers Table
CREATE TABLE IF NOT EXISTS public.dealers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  gstin TEXT,
  distributor_id UUID REFERENCES public.distributors(id) ON DELETE SET NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

-- Retailers Table
CREATE TABLE IF NOT EXISTS public.retailers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;

-- Franchise Partners Table
CREATE TABLE IF NOT EXISTS public.franchise_partners (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  store_location TEXT NOT NULL,
  revenue_share_pct DECIMAL(5,2) DEFAULT 10.00,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.franchise_partners ENABLE ROW LEVEL SECURITY;

-- Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  categories_supplied TEXT DEFAULT '',
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;


-- ── 3. CATEGORIES & PRODUCTS TABLES ──

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'fas fa-tag',
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0,
  mrp DECIMAL(10,2) DEFAULT 0,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT DEFAULT '',
  brochure_url TEXT DEFAULT '',
  in_stock BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  brand TEXT DEFAULT '',
  unit TEXT DEFAULT 'piece',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;


-- ── 4. ORDERS & SERVICES TABLES ──

-- Orders Table (Retail & Bulk)
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_type TEXT DEFAULT 'retail' CHECK (order_type IN ('retail', 'bulk')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  shipping_address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) DEFAULT 0
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'fas fa-bolt',
  price_range TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Bookings Table (Service bookings & assignments)
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  description TEXT DEFAULT '',
  preferred_date DATE,
  preferred_time TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  assigned_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  before_photo_url TEXT DEFAULT '',
  after_photo_url TEXT DEFAULT '',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;


-- ── 5. LEADS, CAREERS, APPLICATIONS, COMPLAINTS, TICKETS ──

-- Leads Table (Contact Form, Request Callback, B2B Applications, Quotations)
CREATE TABLE IF NOT EXISTS public.leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'contact' CHECK (source IN ('contact', 'callback', 'quotation', 'distributor_app', 'dealer_app', 'retailer_app', 'franchise_app', 'vendor_app')),
  territory TEXT DEFAULT '',
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'assigned', 'closed_won', 'closed_lost')),
  assigned_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Careers Table
CREATE TABLE IF NOT EXISTS public.careers (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT 'Rampur Bujurg',
  requirements TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES public.careers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interviewing', 'offered', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
  assigned_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;


-- ── 6. INVOICES, PAYMENTS, NOTIFICATIONS, AUDIT LOGS ──

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL,
  payment_gateway TEXT DEFAULT 'razorpay',
  transaction_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL,
  payment_id BIGINT REFERENCES public.payments(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  pdf_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT DEFAULT '',
  record_id TEXT DEFAULT '',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ── 6A. CMS & RESOURCES (Phase 8 Expansion) ──

-- Blogs Table
CREATE TABLE IF NOT EXISTS public.blogs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- News Table
CREATE TABLE IF NOT EXISTS public.news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '',
  position TEXT DEFAULT 'home_hero' CHECK (position IN ('home_hero', 'home_middle', 'products_top', 'services_top', 'about_top')),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- ── 6B. WARRANTIES & AMC ──

-- Warranties Table
CREATE TABLE IF NOT EXISTS public.warranties (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  invoice_url TEXT DEFAULT '',
  warranty_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- AMC Plans Table
CREATE TABLE IF NOT EXISTS public.amc_plans (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  duration_months INT DEFAULT 12,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.amc_plans ENABLE ROW LEVEL SECURITY;

-- ── 6C. PARTNER NETWORK EXTENSIONS ──

-- Territories Table
CREATE TABLE IF NOT EXISTS public.territories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  assigned_distributor_id UUID REFERENCES public.distributors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

-- Commission Reports Table
CREATE TABLE IF NOT EXISTS public.commission_reports (
  id BIGSERIAL PRIMARY KEY,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('distributor', 'franchise')),
  month_year TEXT NOT NULL, -- e.g., '2026-05'
  total_sales DECIMAL(10,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_reports ENABLE ROW LEVEL SECURITY;

-- ── 6D. SYSTEM TABLES ──

-- Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT DEFAULT 'general' CHECK (document_type IN ('general', 'training', 'marketing', 'policy')),
  access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'employees', 'partners', 'admin_only')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Settings Table (Key-Value)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id BIGSERIAL PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT DEFAULT '',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;


-- ── 7. ROW LEVEL SECURITY (RLS) POLICIES FOR ALL ROLES ──

-- Helper checks
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('super_admin', 'admin', 'owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- public reading policies
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Anyone can read careers" ON public.careers FOR SELECT USING (true);

-- admin manage policies
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin can manage products" ON public.products FOR ALL USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin can manage services" ON public.services FOR ALL USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin can manage careers" ON public.careers FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- customer detail tables
CREATE POLICY "Users can manage own customer details" ON public.customers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admin can view all customer details" ON public.customers FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

-- employee details
CREATE POLICY "Employees can view own profile" ON public.employees FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can manage all employees" ON public.employees FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- partners (distributor, dealer, retailer, vendor, franchise)
CREATE POLICY "Users can manage own distributor profile" ON public.distributors FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admin can view all distributor profiles" ON public.distributors FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can manage own dealer profile" ON public.dealers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admin can view all dealer profiles" ON public.dealers FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can manage own retailer profile" ON public.retailers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admin can view all retailer profiles" ON public.retailers FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can manage own franchise profile" ON public.franchise_partners FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admin can view all franchise profiles" ON public.franchise_partners FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can manage own vendor profile" ON public.vendors FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admin can view all vendor profiles" ON public.vendors FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

-- bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Employees can view assigned bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = assigned_employee_id OR 
  EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employee')
);
CREATE POLICY "Admin can manage all bookings" ON public.bookings FOR ALL USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- orders and order items
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage all orders" ON public.orders FOR ALL USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admin can manage all order items" ON public.order_items FOR ALL USING (public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- leads
CREATE POLICY "Anyone can create leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin/Manager can manage leads" ON public.leads FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- applications
CREATE POLICY "Anyone can submit applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage applications" ON public.applications FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- complaints and support tickets
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin/Staff can manage complaints" ON public.complaints FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can open tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin/Staff can manage tickets" ON public.support_tickets FOR ALL USING (
  public.is_admin_or_staff(auth.uid()) OR 
  auth.uid() = assigned_employee_id
);

-- payments and invoices
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid())
);
CREATE POLICY "Admin can manage all payments" ON public.payments FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = invoices.order_id AND orders.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = invoices.booking_id AND bookings.user_id = auth.uid())
);
CREATE POLICY "Admin can manage all invoices" ON public.invoices FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage all notifications" ON public.notifications FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- audit logs
CREATE POLICY "Admin can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

-- CMS & Resources
CREATE POLICY "Anyone can view published blogs" ON public.blogs FOR SELECT USING (is_published = true OR public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin can manage blogs" ON public.blogs FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Anyone can view published news" ON public.news FOR SELECT USING (is_published = true OR public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin can manage news" ON public.news FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true OR public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin can manage banners" ON public.banners FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- Warranties & AMC
CREATE POLICY "Users can view own warranties" ON public.warranties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage warranties" ON public.warranties FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Anyone can view active AMC plans" ON public.amc_plans FOR SELECT USING (is_active = true OR public.is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin can manage AMC plans" ON public.amc_plans FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- Territories & Commissions
CREATE POLICY "Anyone can view territories" ON public.territories FOR SELECT USING (true);
CREATE POLICY "Admin can manage territories" ON public.territories FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Partners can view own commission reports" ON public.commission_reports FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Admin can manage commission reports" ON public.commission_reports FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- System
CREATE POLICY "Anyone can view public documents" ON public.documents FOR SELECT USING (
  access_level = 'public' OR 
  public.is_admin_or_staff(auth.uid()) OR
  (access_level = 'employees' AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employee')) OR
  (access_level = 'partners' AND EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('distributor', 'dealer', 'retailer', 'franchise_partner', 'vendor')))
);
CREATE POLICY "Admin can manage documents" ON public.documents FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage settings" ON public.settings FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin can view email logs" ON public.email_logs FOR SELECT USING (public.is_admin_or_staff(auth.uid()));


-- ── 8. UPDATED_AT TRIGGER ──
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_warranties_updated_at BEFORE UPDATE ON public.warranties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ── 9. STORAGE BUCKET ──
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin can manage product images" ON storage.objects FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Admin can manage resumes" ON storage.objects FOR ALL USING (public.is_admin_or_staff(auth.uid()));


-- ── 10. SEED DATA ──
INSERT INTO public.services (name, description, icon, price_range, sort_order) VALUES
  ('Electrical Installation', 'Professional installation of appliances, lightings, wiring modules and panel setups.', 'fas fa-tools', '₹200 - ₹5000', 1),
  ('Home Wiring', 'Complete house rewiring and switchboard fittings using fire-retardant ISI wires.', 'fas fa-house-signal', '₹500 - ₹10000', 2),
  ('Commercial Wiring', 'High tension, distribution lines and single/three-phase wiring for offices and buildings.', 'fas fa-building', '₹2000 - ₹50000', 3),
  ('Industrial Wiring', 'Control panel wiring, machinery connections and complete factory system installations.', 'fas fa-industry', '₹5000 - ₹100000+', 4),
  ('Electrical Repair', 'Troubleshooting internal wiring faults, geysers, motor breakdowns and switch issues.', 'fas fa-wrench', '₹150 - ₹1500', 5),
  ('AMC Services', 'Annual Maintenance Contracts for apartments, corporates, and offices with regular visits.', 'fas fa-file-contract', '₹4999/year onwards', 6),
  ('Solar Solutions', 'Rooftop solar installation, offgrid inverter setups, solar water pumps and troubleshooting.', 'fas fa-solar-panel', '₹15000 - ₹200000', 7),
  ('Emergency Services', '24/7 fast action emergency electricians for short circuits, fire hazards, or blackouts.', 'fas fa-truck-medical', '₹500 onwards', 8),
  ('Electrical Inspection', 'Safety audit, thermal scanning, grounding checks, and government licensing assistance.', 'fas fa-clipboard-check', '₹1000 - ₹8000', 9),
  ('Smart Electrical Solutions', 'Home automation systems, smart sensor switchboards, remote controllers and IoT fixtures.', 'fas fa-network-wired', '₹3000 onwards', 10)
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, description, sort_order) VALUES
  ('Wires & Cables', 'fas fa-ethernet', 'House wiring cables, flexible wires, armoured cables', 1),
  ('Switches & Sockets', 'fas fa-toggle-on', 'Modular switches, MCB switches, sockets, regulators', 2),
  ('LED Lights', 'fas fa-lightbulb', 'LED bulbs, tube lights, panel lights, strip lights', 3),
  ('Fans', 'fas fa-fan', 'Ceiling fans, table fans, pedestal fans, exhaust fans', 4),
  ('MCB & Panels', 'fas fa-bolt', 'MCBs, distribution boards, change-over switches', 5),
  ('Electrical Accessories', 'fas fa-plug-circle-bolt', 'Extension cords, plugs, holders, conduit pipes', 6),
  ('Home Appliances', 'fas fa-house-chimney', 'Geysers, inverters, stabilizers, doorbells', 7)
ON CONFLICT (name) DO NOTHING;
