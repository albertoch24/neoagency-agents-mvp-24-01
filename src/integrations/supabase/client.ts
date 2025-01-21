import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://szufbafdhfwqclyixdpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dWZiYWZkaGZ3cWNseWl4ZHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMjg4NzksImV4cCI6MjA1MDgwNDg3OX0.ry4ch2QlWkkgxmM-7ppgUdsAPNB25n8MuimkeqT864M";

// Configure client with enhanced debugging and session persistence
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    debug: true
  },
  global: {
    headers: {
      'x-my-custom-header': 'my-app-name',
    },
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Utility function to verify database connection
export const checkDatabaseConnection = async () => {
  try {
    console.log('🔍 Verifica connessione database...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('❌ Errore connessione database:', {
        error,
        timestamp: new Date().toISOString(),
        url: SUPABASE_URL
      });
      return false;
    }

    console.log('✅ Connessione database verificata:', {
      timestamp: new Date().toISOString(),
      hasData: !!data
    });
    return true;
  } catch (err) {
    console.error('❌ Errore imprevisto nella verifica connessione:', {
      error: err,
      timestamp: new Date().toISOString()
    });
    return false;
  }
};

// Utility function to get current user with profile
export const getCurrentUserWithProfile = async () => {
  try {
    console.log('🔍 Recupero sessione utente...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('❌ Errore sessione:', {
        error: sessionError,
        timestamp: new Date().toISOString()
      });
      return null;
    }

    console.log('✅ Sessione utente recuperata:', {
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Errore recupero profilo:', {
        error: profileError,
        userId: session.user.id,
        timestamp: new Date().toISOString()
      });
      return null;
    }

    console.log('✅ Profilo utente recuperato:', {
      userId: session.user.id,
      hasProfile: !!profile,
      timestamp: new Date().toISOString()
    });

    return {
      user: session.user,
      profile
    };
  } catch (err) {
    console.error('❌ Errore imprevisto nel recupero utente:', {
      error: err,
      timestamp: new Date().toISOString()
    });
    return null;
  }
};