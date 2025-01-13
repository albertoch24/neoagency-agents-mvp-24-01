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
    timestamp: new Date().toISOString()
  });

  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<string | undefined>(undefined);

  const handleDelete = async () => {
    console.log('Starting brief deletion process:', {
      briefId: brief.id,
      timestamp: new Date().toISOString()
    });

    try {
      const { error } = await supabase
        .from('briefs')
        .delete()
        .eq('id', brief.id);

      if (error) {
        console.error('Error deleting brief:', {
          briefId: brief.id,
          error: error.message,
          details: error,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      console.log('Brief deleted successfully:', {
        briefId: brief.id,
        timestamp: new Date().toISOString()
      });

      await queryClient.invalidateQueries({ queryKey: ['briefs'] });
      toast.success('Brief deleted successfully');
    } catch (error: any) {
      console.error('Unexpected error in handleDelete:', {
        briefId: brief.id,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      toast.error(`Error deleting brief: ${error.message}`);
    }
  };

  console.log('BriefDisplay accordion state:', {
    isOpen,
    briefId: brief.id,
    timestamp: new Date().toISOString()
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
            timestamp: new Date().toISOString()
          });
          setIsOpen(value);
        }}
      >
        <AccordionItem value="brief-details">
          <AccordionTrigger className="px-6 py-4">
            <div className="flex justify-between items-center w-full">
              <h3 className="text-lg font-semibold">{brief.title}</h3>
              <BriefActions brief={brief} onDelete={handleDelete} />
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