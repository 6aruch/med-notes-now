-- Create KYC documents table with strict privacy controls
CREATE TYPE public.kyc_document_type AS ENUM ('nin', 'passport', 'drivers_license', 'voters_card', 'national_id');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type kyc_document_type NOT NULL,
  document_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  verification_status kyc_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Users can insert their own KYC documents
CREATE POLICY "Users can submit their own KYC"
ON public.kyc_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view only their own KYC documents
CREATE POLICY "Users can view their own KYC"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own pending KYC documents
CREATE POLICY "Users can update their pending KYC"
ON public.kyc_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND verification_status = 'pending')
WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');

-- Admins can view all KYC documents for verification
CREATE POLICY "Admins can view all KYC documents"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update KYC verification status
CREATE POLICY "Admins can update KYC verification"
ON public.kyc_documents
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_kyc_documents_updated_at
BEFORE UPDATE ON public.kyc_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit log table for KYC access tracking
CREATE TABLE public.kyc_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_document_id UUID NOT NULL REFERENCES public.kyc_documents(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.kyc_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.kyc_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);