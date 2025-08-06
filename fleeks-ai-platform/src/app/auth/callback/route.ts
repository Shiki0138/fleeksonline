import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }

      if (data.session) {
        // Create or update user profile
        const { user } = data.session;
        
        // Check if user profile exists
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist, create profile
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              membership_tier: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
          }
        } else if (!userError) {
          // Update last login
          const { error: updateError } = await supabase
            .from('users')
            .update({
              last_login_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating user profile:', updateError);
          }
        }

        // Redirect to the intended destination
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(new URL('/login?error=callback_failed', requestUrl.origin));
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}