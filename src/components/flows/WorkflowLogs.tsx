import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WorkflowLogHeader } from "./WorkflowLogHeader";
import { WorkflowLogContent } from "./WorkflowLogContent";
import { useWorkflowLogs } from "./hooks/useWorkflowLogs";
import { supabase } from "@/integrations/supabase/client";

export const WorkflowLogs = () => {
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const { data: briefs, isLoading, error } = useWorkflowLogs();

  const handleDeleteSelected = async () => {
    try {
      // First delete all workflow conversations for the selected briefs
      const { error: conversationsError } = await supabase
        .from("workflow_conversations")
        .delete()
        .in("brief_id", selectedLogs);

      if (conversationsError) throw conversationsError;

      // Then delete all brief outputs
      const { error: outputsError } = await supabase
        .from("brief_outputs")
        .delete()
        .in("brief_id", selectedLogs);

      if (outputsError) throw outputsError;

      // Finally delete the briefs
      const { error: briefsError } = await supabase
        .from("briefs")
        .delete()
        .in("id", selectedLogs);

      if (briefsError) throw briefsError;

      toast.success("Selected workflows deleted successfully");
      setSelectedLogs([]);
    } catch (error) {
      console.error("Error deleting workflows:", error);
      toast.error("Failed to delete workflows");
    }
  };

  const toggleLogSelection = (briefId: string) => {
    setSelectedLogs(prev => 
      prev.includes(briefId)
        ? prev.filter(id => id !== briefId)
        : [...prev, briefId]
    );
  };

  if (error) {
    return (
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-destructive text-center mb-4">
            Failed to load workflow logs. Please try again later.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <WorkflowLogHeader 
          selectedLogs={selectedLogs}
          onDeleteSelected={handleDeleteSelected}
        />
      </CardHeader>
      <CardContent>
        <WorkflowLogContent
          briefs={briefs}
          selectedLogs={selectedLogs}
          onToggleSelection={toggleLogSelection}
        />
      </CardContent>
    </Card>
  );
};