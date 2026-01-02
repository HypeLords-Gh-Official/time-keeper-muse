-- Add work_status to profiles for leave/off-duty tracking
ALTER TABLE public.profiles 
ADD COLUMN work_status text DEFAULT 'active' CHECK (work_status IN ('active', 'on-leave', 'off-duty', 'off-work'));

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.work_status IS 'Staff work status: active, on-leave, off-duty, off-work';

-- Allow admins to update all profiles (for department reassignment, status changes, etc.)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user roles (for user deletion)
CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));