-- Add policy to allow users to view their own roles (needed for admin check to work)
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);