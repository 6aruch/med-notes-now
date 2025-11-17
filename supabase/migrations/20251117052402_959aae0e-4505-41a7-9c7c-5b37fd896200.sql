-- Add approval status for doctors
ALTER TABLE public.doctors ADD COLUMN approved BOOLEAN NOT NULL DEFAULT false;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view medical records of their patients" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can create medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can update medical records" ON public.medical_records;

-- Create function to check if doctor is approved
CREATE OR REPLACE FUNCTION public.is_approved_doctor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE user_id = _user_id
      AND approved = true
  )
$$;

-- Create function to check if doctor has appointment with patient
CREATE OR REPLACE FUNCTION public.doctor_has_patient(_doctor_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    INNER JOIN public.doctors d ON d.id = a.doctor_id
    WHERE d.user_id = _doctor_user_id
      AND a.patient_id = _patient_id
      AND d.approved = true
  )
$$;

-- Restrict patient profile access - only approved doctors with appointments can view
CREATE POLICY "Approved doctors can view their patients only"
ON public.patients
FOR SELECT
TO authenticated
USING (
  is_approved_doctor(auth.uid()) 
  AND doctor_has_patient(auth.uid(), id)
);

-- Restrict doctor access to appointments - only approved doctors
CREATE POLICY "Approved doctors can view their appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE doctors.id = appointments.doctor_id
      AND doctors.user_id = auth.uid()
      AND doctors.approved = true
  )
);

CREATE POLICY "Approved doctors can update their appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE doctors.id = appointments.doctor_id
      AND doctors.user_id = auth.uid()
      AND doctors.approved = true
  )
);

-- Restrict medical records access - only approved doctors
CREATE POLICY "Approved doctors can view medical records of their patients"
ON public.medical_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE doctors.id = medical_records.doctor_id
      AND doctors.user_id = auth.uid()
      AND doctors.approved = true
  )
);

CREATE POLICY "Approved doctors can create medical records"
ON public.medical_records
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE doctors.id = medical_records.doctor_id
      AND doctors.user_id = auth.uid()
      AND doctors.approved = true
  )
);

CREATE POLICY "Approved doctors can update medical records"
ON public.medical_records
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE doctors.id = medical_records.doctor_id
      AND doctors.user_id = auth.uid()
      AND doctors.approved = true
  )
);

-- Update doctor profiles policy to restrict viewing to approved only
DROP POLICY IF EXISTS "Patients can view doctor profiles" ON public.doctors;

CREATE POLICY "Patients can view approved doctor profiles only"
ON public.doctors
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'patient'::app_role)
  AND approved = true
);