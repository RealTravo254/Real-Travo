-- Drop and recreate the SELECT policies for hotels to ensure admins can see all items
DROP POLICY IF EXISTS "Allow public read access to approved hotels" ON public.hotels;

CREATE POLICY "Allow public read access to approved hotels" 
ON public.hotels
FOR SELECT
USING (
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Creators can see their own items
  (auth.uid() = created_by)
  OR
  -- Allowed admins can see items
  ((SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text = ANY (allowed_admin_emails))
  OR
  -- Public can see approved and visible items
  ((approval_status = 'approved') AND (is_hidden = false))
);

-- Drop and recreate the SELECT policies for adventure_places (campsites)
DROP POLICY IF EXISTS "Allow public read access to approved adventure_places" ON public.adventure_places;

CREATE POLICY "Allow public read access to approved adventure_places" 
ON public.adventure_places
FOR SELECT
USING (
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Creators can see their own items
  (auth.uid() = created_by)
  OR
  -- Allowed admins can see items
  ((SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text = ANY (allowed_admin_emails))
  OR
  -- Public can see approved and visible items
  ((approval_status = 'approved') AND (is_hidden = false))
);

-- Also update attractions policy to match
DROP POLICY IF EXISTS "Public can view approved attractions" ON public.attractions;

CREATE POLICY "Public can view approved attractions" 
ON public.attractions
FOR SELECT
USING (
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Creators can see their own items
  (auth.uid() = created_by)
  OR
  -- Public can see approved and visible items
  ((approval_status = 'approved') AND (is_hidden = false))
);

-- Update trips policy to match
DROP POLICY IF EXISTS "Allow public read access to approved trips" ON public.trips;

CREATE POLICY "Allow public read access to approved trips" 
ON public.trips
FOR SELECT
USING (
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Creators can see their own items
  (auth.uid() = created_by)
  OR
  -- Public can see approved and visible items
  ((approval_status = 'approved') AND (is_hidden = false))
);