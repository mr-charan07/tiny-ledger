-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  device_type TEXT DEFAULT 'sensor',
  location TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  permission_level SMALLINT NOT NULL DEFAULT 1,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nodes table
CREATE TABLE public.nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  is_validator BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data_records table
CREATE TABLE public.data_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id BIGINT NOT NULL UNIQUE,
  device_address TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  tx_hash TEXT,
  temperature NUMERIC,
  humidity NUMERIC,
  raw_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_records ENABLE ROW LEVEL SECURITY;

-- Devices policies
CREATE POLICY "Users can view their own devices"
ON public.devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own devices"
ON public.devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
ON public.devices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
ON public.devices FOR DELETE
USING (auth.uid() = user_id);

-- Nodes policies
CREATE POLICY "Users can view their own nodes"
ON public.nodes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nodes"
ON public.nodes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nodes"
ON public.nodes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nodes"
ON public.nodes FOR DELETE
USING (auth.uid() = user_id);

-- Data records policies
CREATE POLICY "Users can view their own records"
ON public.data_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own records"
ON public.data_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_address ON public.devices(address);
CREATE INDEX idx_nodes_user_id ON public.nodes(user_id);
CREATE INDEX idx_nodes_address ON public.nodes(address);
CREATE INDEX idx_data_records_user_id ON public.data_records(user_id);
CREATE INDEX idx_data_records_device_address ON public.data_records(device_address);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at
BEFORE UPDATE ON public.nodes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();