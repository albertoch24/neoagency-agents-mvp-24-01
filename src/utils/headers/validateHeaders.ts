
import { supabase } from "@/integrations/supabase/client";

export interface ValidatedHeaders {
  authorization: string;
  apikey: string;
  clientInfo: string;
}

export const validateHeaders = async (): Promise<ValidatedHeaders> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Log session status for debugging
  console.log('🔐 Session status check:', {
    hasSession: !!session,
    hasToken: !!session?.access_token,
    tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiry found',
    now: new Date().toISOString()
  });

  // Check if token is about to expire (less than 5 minutes) and refresh if needed
  if (session?.expires_at && (session.expires_at * 1000 - Date.now() < 5 * 60 * 1000)) {
    console.log('🔄 Token is about to expire, refreshing session...');
    try {
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Failed to refresh session:', refreshError);
      } else if (refreshResult?.session) {
        console.log('✅ Session refreshed successfully');
        session.access_token = refreshResult.session.access_token;
      }
    } catch (refreshError) {
      console.error('❌ Error during session refresh:', refreshError);
    }
  }
  
  const headers = {
    authorization: session?.access_token,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    clientInfo: window.navigator.userAgent
  };

  console.log('🔍 Validating request headers:', {
    hasAuthorization: !!headers.authorization,
    hasApiKey: !!headers.apikey,
    clientInfo: headers.clientInfo?.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  });

  if (!headers.authorization) {
    console.error('❌ Missing authorization header - user not authenticated');
    throw new Error("Missing authorization header - user not authenticated");
  }

  if (!headers.apikey) {
    console.error('❌ Missing API key - check Supabase configuration');
    throw new Error("Missing API key - check Supabase configuration");
  }

  return headers;
};
