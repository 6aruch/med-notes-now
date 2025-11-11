-- Add foreign key constraints for better relationship handling
-- This will allow PostgREST to properly join profiles with doctors and patients

-- Add foreign key from doctors.user_id to profiles.id
ALTER TABLE public.doctors
ADD CONSTRAINT fk_doctors_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from patients.user_id to profiles.id
ALTER TABLE public.patients
ADD CONSTRAINT fk_patients_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;