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
  console.log('BriefDisplay rendering with brief:', {
    briefId: brief?.id,
    briefTitle: brief?.title,
    timestamp: new Date().toISOString(),
    processStage: 'component_render'
  });

  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<string | undefined>(undefined);

  const handleDelete = async () => {
    const operationId = `delete_brief_${brief.id}_${Date.now()}`;
    console.log('Starting brief deletion process:', {
      operationId,
      briefId: brief.id,
      timestamp: new Date().toISOString(),
      processStage: 'deletion_start'
    });

    try {
      console.log('Initiating Supabase delete operation:', {
        operationId,
        briefId: brief.id,
        timestamp: new Date().toISOString(),
        processStage: 'supabase_delete_start'
      });

      const { error } = await supabase
        .from('briefs')
        .delete()
        .eq('id', brief.id);

      if (error) {
        console.error('Error in Supabase delete operation:', {
          operationId,
          briefId: brief.id,
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          timestamp: new Date().toISOString(),
          processStage: 'supabase_delete_error'
        });
        throw error;
      }

      console.log('Brief deleted successfully:', {
        operationId,
        briefId: brief.id,
        timestamp: new Date().toISOString(),
        processStage: 'deletion_success'
      });

      await queryClient.invalidateQueries({ queryKey: ['briefs'] });
      toast.success('Brief deleted successfully');
    } catch (error: any) {
      console.error('Unexpected error in handleDelete:', {
        operationId,
        briefId: brief.id,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        },
        timestamp: new Date().toISOString(),
        processStage: 'deletion_error'
      });
      toast.error(`Error deleting brief: ${error.message}`);
    }
  };

  console.log('BriefDisplay accordion state:', {
    isOpen,
    briefId: brief.id,
    timestamp: new Date().toISOString(),
    processStage: 'accordion_state_check'
  });

  return (
    <Card className="mb-8">
      <Accordion 
        type="single" 
        collapsible 
        value={isOpen} 
        onValueChange={(value) => {
          console.log('Accordion value changing:', {
            previousValue: isOpen,
            newValue: value,
            briefId: brief.id,
            timestamp: new Date().toISOString(),
            processStage: 'accordion_state_change'
          });
          setIsOpen(value);
        }}
      >
        <AccordionItem value="brief-details">
          <AccordionTrigger className="px-6 py-4">
            <div className="flex justify-between items-center w-full">
              <h3 className="text-lg font-semibold">{brief.title}</h3>
              <BriefActions 
                currentBrief={brief}
                showNewBrief={false}
                isEditing={false}
                onNewBrief={() => {
                  console.log('New brief action triggered', {
                    briefId: brief.id,
                    timestamp: new Date().toISOString(),
                    processStage: 'new_brief_action'
                  });
                }}
                onEdit={() => {
                  console.log('Edit brief action triggered', {
                    briefId: brief.id,
                    timestamp: new Date().toISOString(),
                    processStage: 'edit_brief_action'
                  });
                }}
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