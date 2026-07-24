
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  BEGIN
    INSERT INTO public.user_profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
  END;

  RETURN NEW;
END;
$$;

ALTER TABLE public.devices
  ADD CONSTRAINT devices_address_format CHECK (address ~ '^0x[a-fA-F0-9]{40}$') NOT VALID,
  ADD CONSTRAINT devices_name_length CHECK (char_length(name) BETWEEN 1 AND 64) NOT VALID,
  ADD CONSTRAINT devices_type_valid CHECK (device_type IS NULL OR device_type IN ('sensor','actuator','gateway')) NOT VALID,
  ADD CONSTRAINT devices_permission_range CHECK (permission_level BETWEEN 0 AND 2) NOT VALID;

ALTER TABLE public.nodes
  ADD CONSTRAINT nodes_address_format CHECK (address ~ '^0x[a-fA-F0-9]{40}$') NOT VALID,
  ADD CONSTRAINT nodes_name_length CHECK (char_length(name) BETWEEN 1 AND 64) NOT VALID;

ALTER TABLE public.data_records
  ADD CONSTRAINT data_records_hash_format CHECK (data_hash ~ '^0x[a-fA-F0-9]{64}$') NOT VALID,
  ADD CONSTRAINT data_records_tx_hash_format CHECK (tx_hash IS NULL OR tx_hash ~ '^0x[a-fA-F0-9]{64}$') NOT VALID,
  ADD CONSTRAINT data_records_device_address_format CHECK (device_address ~ '^0x[a-fA-F0-9]{40}$') NOT VALID,
  ADD CONSTRAINT data_records_temperature_range CHECK (temperature IS NULL OR (temperature >= -100 AND temperature <= 200)) NOT VALID,
  ADD CONSTRAINT data_records_humidity_range CHECK (humidity IS NULL OR (humidity >= 0 AND humidity <= 100)) NOT VALID;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') NOT VALID,
  ADD CONSTRAINT user_profiles_display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 100) NOT VALID;

CREATE POLICY "Users can delete their own records"
ON public.data_records
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

REVOKE ALL ON public.user_profiles FROM anon;
