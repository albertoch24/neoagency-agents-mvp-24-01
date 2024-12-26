import { format } from "date-fns";
import { WorkflowStageList } from "./WorkflowStageList";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface WorkflowLogItemProps {
  brief: any;
}

export const WorkflowLogItem = ({ brief }: WorkflowLogItemProps) => {
  const queryClient = useQueryClient();
  
  // Group conversations by stage
  const conversationsByStage = brief.conversations?.reduce((acc: any, conv: any) => {
    if (!acc[conv.stage_id]) {
      acc[conv.stage_id] = [];
    }
    acc[conv.stage_id].push(conv);
    return acc;
  }, {});

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("briefs")
        .delete()
        .eq("id", brief.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["workflow-logs"] });
      toast.success("Log deleted successfully");
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Failed to delete log");
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={brief.id}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex justify-between items-center w-full pr-4">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{brief.title}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(brief.created_at), "PPpp")}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6 pt-4">
            <WorkflowStageList 
              stages={Object.entries(conversationsByStage || {})} 
              briefOutputs={brief.brief_outputs}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};