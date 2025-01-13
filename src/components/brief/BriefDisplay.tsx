import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { BriefActions } from "./BriefActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Brief {
  id: string;
  title: string;
  description?: string;
  objectives?: string;
  target_audience?: string;
  budget?: string;
  timeline?: string;
  brand?: string;
}

interface BriefDisplayProps {
  brief: Brief;
}

const SUPABASE_URL = "https://szufbafdhfwqclyixdpd.supabase.co";

const BriefDisplay = ({ brief }: BriefDisplayProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<string | undefined>(undefined);

  const handleDelete = async () => {
    const operationId = `rag_api_call_${brief.id}_${Date.now()}`;
    
    // Get current session state
    const { data: { session } } = await supabase.auth.getSession();
    
    // Log API call initialization with auth details
    console.log('🚀 RAG API Call - Initialization:', {
      operationId,
      briefId: brief.id,
      endpoint: 'briefs',
      method: 'DELETE',
      authStatus: {
        isAuthenticated: !!session,
        tokenExpiry: session?.expires_at,
        userId: session?.user?.id,
        role: session?.user?.role
      },
      timestamp: new Date().toISOString(),
      processStage: 'api_call_init'
    });

    try {
      // Log detailed API request configuration
      console.log('📝 RAG API Call - Request Configuration:', {
        operationId,
        briefId: brief.id,
        requestDetails: {
          url: `${SUPABASE_URL}/rest/v1/briefs?id=eq.${brief.id}`,
          headers: {
            authorization: session?.access_token ? 'Bearer token present' : 'No bearer token',
            apikey: 'API key present',
            'content-type': 'application/json'
          }
        },
        timestamp: new Date().toISOString(),
        processStage: 'api_request_config'
      });

      const { error, status, statusText } = await supabase
        .from('briefs')
        .delete()
        .eq('id', brief.id);

      // Log API response details
      console.log('📨 RAG API Call - Response:', {
        operationId,
        briefId: brief.id,
        responseDetails: {
          status,
          statusText,
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code
        },
        authContext: {
          tokenPresent: !!session?.access_token,
          tokenExpiryTime: session?.expires_at,
          timeTillExpiry: session?.expires_at ? new Date(session.expires_at).getTime() - Date.now() : 'N/A'
        },
        timestamp: new Date().toISOString(),
        processStage: 'api_response_received'
      });

      if (error) {
        // Log detailed error information
        console.error('❌ RAG API Call - Error Details:', {
          operationId,
          briefId: brief.id,
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          authenticationContext: {
            sessionExists: !!session,
            tokenExpiry: session?.expires_at,
            userRole: session?.user?.role,
            requestHeaders: {
              authPresent: !!session?.access_token,
              apikeyPresent: true
            }
          },
          timestamp: new Date().toISOString(),
          processStage: 'api_error_details'
        });
        throw error;
      }

      // Log successful completion
      console.log('✅ RAG API Call - Success:', {
        operationId,
        briefId: brief.id,
        completionDetails: {
          status,
          statusText,
          sessionValid: !!session,
          tokenExpiryTime: session?.expires_at
        },
        timestamp: new Date().toISOString(),
        processStage: 'api_call_success'
      });

      await queryClient.invalidateQueries({ queryKey: ['briefs'] });
      toast.success('Brief deleted successfully');
    } catch (error: any) {
      // Log unexpected errors with full context
      console.error('💥 RAG API Call - Unexpected Error:', {
        operationId,
        briefId: brief.id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        },
        authenticationState: {
          hasValidSession: !!session,
          sessionStatus: session?.user?.aud,
          tokenExpiry: session?.expires_at,
          lastError: error.error?.message
        },
        requestContext: {
          apiKeyPresent: true,
          baseUrl: SUPABASE_URL,
          timestamp: new Date().toISOString()
        },
        processStage: 'api_unexpected_error'
      });
      toast.error(`Error deleting brief: ${error.message}`);
    }
  };

  return (
    <Card className="mb-8">
      <Accordion 
        type="single" 
        collapsible 
        value={isOpen} 
        onValueChange={setIsOpen}
      >
        <AccordionItem value="brief-details">
          <AccordionTrigger className="px-6 py-4">
            <div className="flex justify-between items-center w-full">
              <h3 className="text-lg font-semibold">{brief.title}</h3>
              <BriefActions 
                currentBrief={brief}
                showNewBrief={false}
                isEditing={false}
                onNewBrief={() => {}}
                onEdit={() => {}}
                onDelete={handleDelete}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4">
            <div className="space-y-4">
              {brief.brand && (
                <div>
                  <h4 className="font-medium">Brand</h4>
                  <p className="text-gray-600">{brief.brand}</p>
                </div>
              )}
              {brief.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-gray-600">{brief.description}</p>
                </div>
              )}
              {brief.objectives && (
                <div>
                  <h4 className="font-medium">Objectives</h4>
                  <p className="text-gray-600">{brief.objectives}</p>
                </div>
              )}
              {brief.target_audience && (
                <div>
                  <h4 className="font-medium">Target Audience</h4>
                  <p className="text-gray-600">{brief.target_audience}</p>
                </div>
              )}
              {brief.budget && (
                <div>
                  <h4 className="font-medium">Budget</h4>
                  <p className="text-gray-600">{brief.budget}</p>
                </div>
              )}
              {brief.timeline && (
                <div>
                  <h4 className="font-medium">Timeline</h4>
                  <p className="text-gray-600">{brief.timeline}</p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default BriefDisplay;