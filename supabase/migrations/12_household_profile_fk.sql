-- Add FK to allow joining households with profiles to get creator name
ALTER TABLE public.households 
ADD CONSTRAINT households_created_by_profile_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id);
