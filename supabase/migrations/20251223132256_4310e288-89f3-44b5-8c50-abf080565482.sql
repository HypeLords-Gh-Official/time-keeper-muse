-- Create attendance_records table for tracking clock-in, clock-out, breaks
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out_time TIMESTAMP WITH TIME ZONE,
  activity TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own attendance records
CREATE POLICY "Users can view their own attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own attendance records
CREATE POLICY "Users can insert their own attendance records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance records
CREATE POLICY "Users can update their own attendance records" 
ON public.attendance_records 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins and supervisors can view all attendance records
CREATE POLICY "Admins and supervisors can view all attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_attendance_records_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_attendance_records_user_id ON public.attendance_records(user_id);
CREATE INDEX idx_attendance_records_clock_in_time ON public.attendance_records(clock_in_time);