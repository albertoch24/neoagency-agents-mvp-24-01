import { format } from "date-fns";
import { WorkflowStageList } from "./WorkflowStageList";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Workflow } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface WorkflowLogItemProps {
  brief: any;
}

export const WorkflowLogItem = ({ brief }: WorkflowLogItemProps) => {
  const queryClient = useQueryClient();
  
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
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(brief.created_at), "PPpp")}
                </span>
              </div>
              <Badge variant="secondary">
                Stage: {brief.current_stage || "Not started"}
              </Badge>
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Flow ID: {brief.flow_id || "N/A"}
                  {brief.flows && ` - ${brief.flows.name}`}
                </span>
              </div>
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
            {brief.stages?.map((stage: any) => (
              <div key={stage.stage} className="border-l-2 border-muted pl-4">
                <h4 className="text-lg font-semibold mb-2 capitalize">
                  Stage: {stage.stage}
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">
                      Agents Involved:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {stage.agents.map((agent: string) => (
                        <Badge key={agent} variant="outline">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <WorkflowStageList 
                    stages={[[stage.stage, stage.conversations]]}
                    briefOutputs={stage.outputs}
                  />
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};