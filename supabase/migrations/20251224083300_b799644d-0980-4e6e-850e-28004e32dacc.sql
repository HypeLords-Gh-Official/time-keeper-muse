-- Add staff_number column to profiles table
ALTER TABLE public.profiles
ADD COLUMN staff_number TEXT UNIQUE;

-- Create a function to generate the next staff number
CREATE OR REPLACE FUNCTION public.generate_staff_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  staff_num TEXT;
BEGIN
  -- Get the highest existing staff number
  SELECT COALESCE(MAX(CAST(SUBSTRING(staff_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.profiles
  WHERE staff_number IS NOT NULL AND staff_number ~ '^STF[0-9]+$';
  
  -- Format as STF001, STF002, etc.
  staff_num := 'STF' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN staff_num;
END;
$$;

-- Create a trigger to auto-generate staff number on profile insert
CREATE OR REPLACE FUNCTION public.set_staff_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.staff_number IS NULL THEN
    NEW.staff_number := public.generate_staff_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_staff_number
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_staff_number();