-- Add RESTRICTIVE policy for defense-in-depth on kyc_documents
-- This ensures ONLY document owners OR admins can access KYC data

CREATE POLICY "Restrict KYC access to owner or admin"
ON public.kyc_documents
AS RESTRICTIVE
FOR ALL
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);