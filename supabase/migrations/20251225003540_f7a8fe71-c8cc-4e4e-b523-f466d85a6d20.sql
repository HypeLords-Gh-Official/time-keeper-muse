-- Add DELETE policy for admins on login_verifications table
CREATE POLICY "Admins can delete verifications" 
ON public.login_verifications 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));