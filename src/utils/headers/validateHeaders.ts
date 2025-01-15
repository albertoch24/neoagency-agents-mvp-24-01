import { supabase } from "@/integrations/supabase/client";

export interface ValidatedHeaders {
  authorization: string;
  apikey: string;
  clientInfo: string;
}

export const validateHeaders = async (): Promise<ValidatedHeaders> => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    authorization: session?.access_token,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    clientInfo: window.navigator.userAgent
  };

  console.log('🔍 Validating request headers:', {
    hasAuthorization: !!headers.authorization,
    hasApiKey: !!headers.apikey,
    clientInfo: headers.clientInfo,
    timestamp: new Date().toISOString()
  });

  if (!headers.authorization) {
    throw new Error("Missing authorization header - user not authenticated");
  }

  if (!headers.apikey) {
    throw new Error("Missing API key - check Supabase configuration");
  }

  return headers;
};