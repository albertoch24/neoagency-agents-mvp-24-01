import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Auth page effect running");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === 'SIGNED_IN') {
        const from = (location.state as any)?.from?.pathname || "/";
        console.log("Redirecting to:", from);
        navigate(from);
        toast.success("Accesso effettuato con successo!");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">Benvenuto</h1>
          <p className="text-center text-muted-foreground">
            Accedi o registrati per continuare
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#000000',
                  brandAccent: '#666666',
                }
              }
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Accedi',
                loading_button_label: 'Accesso in corso...',
                social_provider_text: 'Accedi con {{provider}}',
                link_text: 'Hai già un account? Accedi'
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Registrati',
                loading_button_label: 'Registrazione in corso...',
                social_provider_text: 'Registrati con {{provider}}',
                link_text: 'Non hai un account? Registrati'
              }
            }
          }}
          theme="light"
          providers={[]}
        />
      </Card>
    </div>
  );
};

export default AuthPage;