import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export const isNative = () => Capacitor.isNativePlatform();

// Lazy reference to the native GoogleAuth plugin (only works on native)
let _googleAuth: any = null;
function getGoogleAuth() {
  if (!_googleAuth) {
    // Access via the global Capacitor plugins registry
    _googleAuth = (window as any).Capacitor?.Plugins?.GoogleAuth;
  }
  if (!_googleAuth) {
    throw new Error('GoogleAuth plugin not available. Ensure @codetrix-studio/capacitor-google-auth is installed and synced.');
  }
  return _googleAuth;
}

export async function signInWithGoogleNative() {
  if (!isNative()) {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    return null;
  }

  const GoogleAuth = getGoogleAuth();

  try {
    await GoogleAuth.initialize({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });

    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser.authentication?.idToken;
    if (!idToken) {
      throw new Error('No ID token received from Google Sign-In');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    if (err?.message?.includes('popup_closed') || err?.message?.includes('canceled')) {
      return null;
    }
    throw err;
  }
}
