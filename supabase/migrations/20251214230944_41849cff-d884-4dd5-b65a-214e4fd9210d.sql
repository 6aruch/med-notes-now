-- Drop the overly permissive audit log insert policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.kyc_audit_log;

-- Create restrictive policy that only allows admin users to insert audit logs
CREATE POLICY "Admin functions can insert audit logs" 
ON public.kyc_audit_log 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create enum for allowed audit action types
DO $$ BEGIN
  CREATE TYPE audit_action_type AS ENUM (
    'STATUS_CHANGED',
    'DOCUMENT_VIEWED',
    'DOCUMENT_UPDATED',
    'VERIFICATION_STARTED',
    'VERIFICATION_COMPLETED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add validation trigger for action field format
CREATE OR REPLACE FUNCTION validate_audit_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate action field format: must start with allowed prefix and be reasonable length
  IF NEW.action IS NULL OR LENGTH(NEW.action) > 200 THEN
    RAISE EXCEPTION 'Action must be non-null and under 200 characters';
  END IF;
  
  -- Validate action starts with known prefixes
  IF NOT (
    NEW.action LIKE 'STATUS_CHANGED:%' OR
    NEW.action LIKE 'DOCUMENT_VIEWED:%' OR
    NEW.action LIKE 'DOCUMENT_UPDATED:%' OR
    NEW.action LIKE 'VERIFICATION_STARTED:%' OR
    NEW.action LIKE 'VERIFICATION_COMPLETED:%'
  ) THEN
    RAISE EXCEPTION 'Action must start with a valid action type prefix';
  END IF;
  
  -- Sanitize: only allow alphanumeric, spaces, underscores, colons, and hyphens
  IF NEW.action !~ '^[A-Za-z0-9_: -]+$' THEN
    RAISE EXCEPTION 'Action contains invalid characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_audit_action_trigger
  BEFORE INSERT OR UPDATE ON public.kyc_audit_log
  FOR EACH ROW EXECUTE FUNCTION validate_audit_action();

-- Update the process_kyc function to use the new action format
CREATE OR REPLACE FUNCTION process_kyc(
  kyc_id UUID, 
  new_status kyc_status,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  UPDATE public.kyc_documents 
  SET verification_status = new_status,
      verified_at = CASE WHEN new_status = 'verified' THEN NOW() ELSE NULL END,
      verified_by = CASE WHEN new_status = 'verified' THEN auth.uid() ELSE NULL END,
      rejection_reason = CASE WHEN new_status = 'rejected' THEN reason ELSE NULL END,
      updated_at = NOW()
  WHERE id = kyc_id;
  
  -- Log to audit with validated format
  INSERT INTO public.kyc_audit_log (kyc_document_id, accessed_by, action)
  VALUES (kyc_id, auth.uid(), 'STATUS_CHANGED: ' || new_status::text);
END;
$$;