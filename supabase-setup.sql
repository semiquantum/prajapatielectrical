-- ============================================
-- PRAJAPATI ELECTRICAL — Supabase Database Setup
-- Run this entire script in the Supabase SQL Editor
-- ============================================

-- ── 1. PROFILES TABLE ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
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
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. CATEGORIES TABLE ──
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'fas fa-tag',
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── 3. PRODUCTS TABLE ──
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0,
  mrp DECIMAL(10,2) DEFAULT 0,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT DEFAULT '',
  in_stock BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  brand TEXT DEFAULT '',
  unit TEXT DEFAULT 'piece',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage products"
  ON public.products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── 4. SERVICES TABLE ──
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

CREATE POLICY "Anyone can read services"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage services"
  ON public.services FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── 5. BOOKINGS TABLE ──
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
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can cancel own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');


-- ── 6. STORAGE BUCKET ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── 7. UPDATED_AT TRIGGER ──
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ── 8. SEED DATA — SERVICES ──
INSERT INTO public.services (name, description, icon, price_range, sort_order) VALUES
  ('Iron Repair', 'Expert iron box repairing service. We fix all types of dry and steam irons quickly and affordably.', 'fas fa-fire', '₹100 - ₹300', 1),
  ('Mixer Repair', 'Professional mixer grinder repair. Motor rewinding, blade replacement and complete servicing available.', 'fas fa-blender', '₹150 - ₹500', 2),
  ('Fan Repair', 'Ceiling fan, table fan, and exhaust fan repair. Capacitor change, rewinding & installation services.', 'fas fa-fan', '₹100 - ₹400', 3),
  ('AC Repair', 'Split AC and window AC repair, gas charging, servicing and installation by trained technicians.', 'fas fa-snowflake', '₹300 - ₹2000', 4),
  ('Cooler Repair', 'Desert cooler and air cooler repair. Motor replacement, pump repair and full servicing available.', 'fas fa-wind', '₹150 - ₹600', 5),
  ('Fridge Repair', 'Refrigerator repair and servicing. Gas charging, thermostat repair, compressor servicing and more.', 'fas fa-temperature-low', '₹200 - ₹1500', 6),
  ('House Wiring', 'Complete house wiring and rewiring services. New construction and renovation electrical work done professionally.', 'fas fa-house-signal', '₹500 - ₹5000+', 7),
  ('Electrical Fitting', 'All types of electrical fittings including switches, sockets, MCBs, distribution boards and more.', 'fas fa-plug', '₹100 - ₹1000', 8),
  ('Installation Services', 'Professional installation of AC, ceiling fans, geysers, inverters, and all electrical appliances.', 'fas fa-tools', '₹200 - ₹1500', 9),
  ('Switch Board Repair', 'Switchboard repair, replacement and new installation. Modular switchboard fitting available.', 'fas fa-toggle-on', '₹100 - ₹500', 10),
  ('Motor Repair', 'Electric motor rewinding and repair. Submersible pump, monoblock pump and all motor servicing.', 'fas fa-gear', '₹300 - ₹2000', 11)
ON CONFLICT DO NOTHING;


-- ── 9. SEED DATA — CATEGORIES ──
INSERT INTO public.categories (name, icon, description, sort_order) VALUES
  ('Wires & Cables', 'fas fa-ethernet', 'House wiring cables, flexible wires, armoured cables', 1),
  ('Switches & Sockets', 'fas fa-toggle-on', 'Modular switches, MCB switches, sockets, regulators', 2),
  ('LED Lights', 'fas fa-lightbulb', 'LED bulbs, tube lights, panel lights, strip lights', 3),
  ('Fans', 'fas fa-fan', 'Ceiling fans, table fans, pedestal fans, exhaust fans', 4),
  ('MCB & Panels', 'fas fa-bolt', 'MCBs, distribution boards, change-over switches', 5),
  ('Electrical Accessories', 'fas fa-plug-circle-bolt', 'Extension cords, plugs, holders, conduit pipes', 6),
  ('Home Appliances', 'fas fa-house-chimney', 'Geysers, inverters, stabilizers, doorbells', 7)
ON CONFLICT (name) DO NOTHING;


-- ── 10. HELPER: Promote a user to admin ──
-- Run this AFTER signing up with your admin email:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL');
