-- Add length constraints to medical_records fields via validation trigger
CREATE OR REPLACE FUNCTION validate_medical_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate diagnosis length
  IF NEW.diagnosis IS NOT NULL AND LENGTH(NEW.diagnosis) > 5000 THEN
    RAISE EXCEPTION 'Diagnosis must be 5000 characters or less';
  END IF;
  
  -- Validate prescription length
  IF NEW.prescription IS NOT NULL AND LENGTH(NEW.prescription) > 5000 THEN
    RAISE EXCEPTION 'Prescription must be 5000 characters or less';
  END IF;
  
  -- Validate notes length
  IF NEW.notes IS NOT NULL AND LENGTH(NEW.notes) > 5000 THEN
    RAISE EXCEPTION 'Notes must be 5000 characters or less';
  END IF;
  
  -- Validate lab_results length
  IF NEW.lab_results IS NOT NULL AND LENGTH(NEW.lab_results) > 5000 THEN
    RAISE EXCEPTION 'Lab results must be 5000 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_medical_record_trigger
  BEFORE INSERT OR UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION validate_medical_record();

-- Add length constraints to appointments fields via validation trigger
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate reason length
  IF NEW.reason IS NOT NULL AND LENGTH(NEW.reason) > 1000 THEN
    RAISE EXCEPTION 'Reason must be 1000 characters or less';
  END IF;
  
  -- Validate notes length
  IF NEW.notes IS NOT NULL AND LENGTH(NEW.notes) > 2000 THEN
    RAISE EXCEPTION 'Notes must be 2000 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION validate_appointment();

-- Rate limiting for appointment creation (max 5 per hour per patient)
CREATE OR REPLACE FUNCTION check_appointment_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.appointments 
      WHERE patient_id = NEW.patient_id 
      AND created_at > NOW() - INTERVAL '1 hour') >= 5 THEN
    RAISE EXCEPTION 'Too many appointments created. Please wait before creating more.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_appointment_rate
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION check_appointment_rate();

-- Rate limiting for medical record creation (max 20 per hour per doctor)
CREATE OR REPLACE FUNCTION check_medical_record_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.medical_records 
      WHERE doctor_id = NEW.doctor_id 
      AND created_at > NOW() - INTERVAL '1 hour') >= 20 THEN
    RAISE EXCEPTION 'Too many records created. Please slow down.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_medical_record_rate
  BEFORE INSERT ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION check_medical_record_rate();

-- Admin RPC function to approve/reject doctors
CREATE OR REPLACE FUNCTION approve_doctor(doctor_id UUID, should_approve BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  UPDATE public.doctors SET approved = should_approve, updated_at = NOW() WHERE id = doctor_id;
END;
$$;

-- Admin RPC function to process KYC verification
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
  
  -- Log to audit
  INSERT INTO public.kyc_audit_log (kyc_document_id, accessed_by, action)
  VALUES (kyc_id, auth.uid(), 'STATUS_CHANGED: ' || new_status);
END;
$$;

-- Admin RPC function to get pending doctors
CREATE OR REPLACE FUNCTION get_pending_doctors()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  specialization TEXT,
  license_number TEXT,
  years_of_experience INTEGER,
  bio TEXT,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.user_id,
    d.specialization,
    d.license_number,
    d.years_of_experience,
    d.bio,
    p.full_name,
    au.email,
    d.created_at
  FROM public.doctors d
  INNER JOIN public.profiles p ON p.id = d.user_id
  INNER JOIN auth.users au ON au.id = d.user_id
  WHERE d.approved = false
  ORDER BY d.created_at DESC;
END;
$$;

-- Admin RPC function to get pending KYC documents
CREATE OR REPLACE FUNCTION get_pending_kyc()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  document_type kyc_document_type,
  document_number TEXT,
  full_name TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    k.id,
    k.user_id,
    k.document_type,
    k.document_number,
    k.full_name,
    k.date_of_birth,
    k.created_at,
    au.email as user_email
  FROM public.kyc_documents k
  INNER JOIN auth.users au ON au.id = k.user_id
  WHERE k.verification_status = 'pending'
  ORDER BY k.created_at DESC;
END;
$$;