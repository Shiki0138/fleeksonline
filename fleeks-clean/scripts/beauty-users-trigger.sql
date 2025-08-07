-- Trigger for Auto Profile Creation with beauty_users table
-- Run this after the main migration

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_beauty_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name,
    membership_type,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free',
    CASE 
      WHEN NEW.email = 'greenroom51@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on beauty_users table
DROP TRIGGER IF EXISTS on_beauty_user_created ON beauty_users;
CREATE TRIGGER on_beauty_user_created
  AFTER INSERT ON beauty_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_beauty_user();

-- Test the trigger with a sample user (optional)
-- INSERT INTO beauty_users (email, email_confirmed_at)
-- VALUES ('test@example.com', NOW())
-- ON CONFLICT (email) DO NOTHING;