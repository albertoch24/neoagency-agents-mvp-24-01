import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  refreshSession: () => Promise<void>; // Add refresh function to context
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh session function that can be called from components
  const refreshSession = async () => {
    try {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        toast.error('Session refresh failed. Please log in again.');
        // Clear stored session on refresh error
        localStorage.removeItem('supabase.auth.session');
        setSession(null);
        setUser(null);
        return;
      }
      
      if (refreshedSession) {
        console.log("Session refreshed successfully");
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        localStorage.setItem('supabase.auth.session', JSON.stringify(refreshedSession));
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
      toast.error('Session refresh failed. Please log in again.');
    }
  };

  useEffect(() => {
    console.log("AuthProvider effect running");

    // Initialize session from local storage if available
    const storedSession = localStorage.getItem('supabase.auth.session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log("Found stored session:", parsedSession);
        setSession(parsedSession);
        setUser(parsedSession?.user ?? null);
        
        // Check if session needs refresh
        const expiresAt = parsedSession?.expires_at;
        if (expiresAt && Date.now() >= (expiresAt * 1000) - (5 * 60 * 1000)) { // Refresh 5 minutes before expiration
          console.log("Session near expiration, refreshing");
          refreshSession();
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('supabase.auth.session');
      }
    }

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Initial session fetch:", session);
      if (error) {
        console.error('Error fetching session:', error);
        toast.error('Error fetching session. Please try logging in again.');
        return;
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
        localStorage.setItem('supabase.auth.session', JSON.stringify(session));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
        localStorage.setItem('supabase.auth.session', JSON.stringify(session));
      } else {
        setSession(null);
        setUser(null);
        localStorage.removeItem('supabase.auth.session');
      }
      
      setLoading(false);
    });

    // Set up periodic session refresh (every 30 minutes)
    const refreshInterval = setInterval(refreshSession, 30 * 60 * 1000);

    // Cleanup subscription and interval
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};