-- Create departments table
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can view departments
CREATE POLICY "Anyone can view departments"
ON public.departments
FOR SELECT
USING (true);

-- Only admins can manage departments
CREATE POLICY "Admins can insert departments"
ON public.departments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update departments"
ON public.departments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete departments"
ON public.departments
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Insert default departments
INSERT INTO public.departments (name) VALUES
  ('Tours'),
  ('Exhibitions'),
  ('Administration'),
  ('Human Resources'),
  ('Finance'),
  ('Operations'),
  ('Marketing'),
  ('Sales'),
  ('IT'),
  ('Customer Service'),
  ('Research & Development'),
  ('Legal');