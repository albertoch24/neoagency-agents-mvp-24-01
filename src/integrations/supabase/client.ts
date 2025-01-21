import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://szufbafdhfwqclyixdpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dWZiYWZkaGZ3cWNseWl4ZHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMjg4NzksImV4cCI6MjA1MDgwNDg3OX0.ry4ch2QlWkkgxmM-7ppgUdsAPNB25n8MuimkeqT864M";

// Configurazione del client con opzioni aggiuntive per la gestione degli errori
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
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

// Funzione di utilità per verificare la connessione
export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    console.log('Database connection successful');
    return true;
  } catch (err) {
    console.error('Database connection check failed:', err);
    return false;
  }
};

// Funzione per ottenere l'utente corrente con il profilo
export const getCurrentUserWithProfile = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    return {
      user: session.user,
      profile
    };
  } catch (err) {
    console.error('Get current user error:', err);
    return null;
  }
};