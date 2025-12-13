-- First, let's create the trigger that's missing
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Now let's sync any existing auth users that are missing profiles
INSERT INTO public.profiles (id, nome, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'nome', au.email),
  au.email
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Insert missing user_roles for users without a role (default to professor)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.id,
  'professor'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.id IS NULL;