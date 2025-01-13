import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Brief {
  id: string;
  title: string;
  description: string;
  objectives: string;
  target_audience: string;
  budget: string;
  timeline: string;
  current_stage: string;
}

interface BriefDisplayProps {
  brief: Brief;
}

const BriefDisplay = ({ brief }: BriefDisplayProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<string | undefined>(undefined);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("briefs")
        .delete()
        .eq("id", brief.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["briefs"] });
      queryClient.invalidateQueries({ queryKey: ["brief"] });
      toast.success("Brief deleted successfully");
    } catch (error) {
      console.error("Error deleting brief:", error);
      toast.error("Failed to delete brief");
    }
  };

  return (
    <Card className="mb-8">
      <Accordion type="single" collapsible value={isOpen} onValueChange={setIsOpen}>
        <AccordionItem value="brief-details">
          <AccordionTrigger className="px-6 py-4">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-xl font-semibold">{brief.title}</h2>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="ml-4"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Description</h3>
                <p>{brief.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Objectives</h3>
                <p>{brief.objectives}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Target Audience</h3>
                <p>{brief.target_audience}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Budget</h3>
                <p>{brief.budget}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Timeline</h3>
                <p>{brief.timeline}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Current Stage</h3>
                <p>{brief.current_stage}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default BriefDisplay;