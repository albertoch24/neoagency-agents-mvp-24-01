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

const BriefDisplay = ({ brief }: BriefDisplayProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<string | undefined>(undefined);

  const handleDelete = async () => {
    const operationId = `rag_api_call_${brief.id}_${Date.now()}`;
    
    // Log API call initialization
    console.log('Initializing RAG API call:', {
      operationId,
      briefId: brief.id,
      endpoint: 'briefs',
      method: 'DELETE',
      authStatus: supabase.auth.session() ? 'authenticated' : 'unauthenticated',
      timestamp: new Date().toISOString(),
      processStage: 'api_call_init'
    });

    try {
      // Log API request details
      console.log('Making RAG API request:', {
        operationId,
        briefId: brief.id,
        headers: {
          authorization: supabase.auth.session()?.access_token ? 'present' : 'missing',
          apikey: supabase.auth.session()?.access_token ? 'present' : 'missing'
        },
        timestamp: new Date().toISOString(),
        processStage: 'api_request_start'
      });

      const { error, status, statusText } = await supabase
        .from('briefs')
        .delete()
        .eq('id', brief.id);

      // Log API response
      console.log('RAG API response received:', {
        operationId,
        briefId: brief.id,
        status,
        statusText,
        hasError: !!error,
        timestamp: new Date().toISOString(),
        processStage: 'api_response_received'
      });

      if (error) {
        console.error('RAG API error details:', {
          operationId,
          briefId: brief.id,
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          authDetails: {
            session: !!supabase.auth.session(),
            tokenExpiry: supabase.auth.session()?.expires_at,
            role: supabase.auth.session()?.user?.role
          },
          timestamp: new Date().toISOString(),
          processStage: 'api_error_details'
        });
        throw error;
      }

      // Log successful API completion
      console.log('RAG API call completed successfully:', {
        operationId,
        briefId: brief.id,
        timestamp: new Date().toISOString(),
        processStage: 'api_call_success'
      });

      await queryClient.invalidateQueries({ queryKey: ['briefs'] });
      toast.success('Brief deleted successfully');
    } catch (error: any) {
      // Log unexpected API errors
      console.error('Unexpected RAG API error:', {
        operationId,
        briefId: brief.id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        },
        authContext: {
          hasSession: !!supabase.auth.session(),
          sessionStatus: supabase.auth.session()?.user?.aud,
          lastError: error.error?.message
        },
        timestamp: new Date().toISOString(),
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