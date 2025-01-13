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
    const operationId = `rag_brief_deletion_${brief.id}_${Date.now()}`;
    console.log('Starting RAG brief deletion process:', {
      operationId,
      briefId: brief.id,
      brand: brief.brand,
      timestamp: new Date().toISOString(),
      processStage: 'rag_deletion_start'
    });

    try {
      // First, log the attempt to clean up RAG data
      console.log('Initiating RAG data cleanup:', {
        operationId,
        briefId: brief.id,
        brand: brief.brand,
        timestamp: new Date().toISOString(),
        processStage: 'rag_cleanup_start'
      });

      // Attempt the deletion
      const { error } = await supabase
        .from('briefs')
        .delete()
        .eq('id', brief.id);

      if (error) {
        console.error('Error in RAG data cleanup:', {
          operationId,
          briefId: brief.id,
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          timestamp: new Date().toISOString(),
          processStage: 'rag_cleanup_error'
        });
        throw error;
      }

      console.log('RAG data cleanup completed:', {
        operationId,
        briefId: brief.id,
        brand: brief.brand,
        timestamp: new Date().toISOString(),
        processStage: 'rag_cleanup_success'
      });

      await queryClient.invalidateQueries({ queryKey: ['briefs'] });
      toast.success('Brief and associated RAG data deleted successfully');
    } catch (error: any) {
      console.error('Unexpected error in RAG cleanup process:', {
        operationId,
        briefId: brief.id,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        },
        timestamp: new Date().toISOString(),
        processStage: 'rag_cleanup_unexpected_error'
      });
      toast.error(`Error deleting brief and RAG data: ${error.message}`);
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