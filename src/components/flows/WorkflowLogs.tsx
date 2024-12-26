import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, History, Trash2 } from "lucide-react";
import { WorkflowLogItem } from "./WorkflowLogItem";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";

export const WorkflowLogs = () => {
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  const { data: briefs, isLoading } = useQuery({
    queryKey: ["workflow-logs"],
    queryFn: async () => {
      console.log("Fetching workflow logs...");
      const { data, error } = await supabase
        .from("briefs")
        .select(`
          id,
          title,
          created_at,
          brief_outputs (
            stage,
            content,
            created_at
          ),
          workflow_conversations (
            stage_id,
            content,
            created_at,
            agent_id,
            agents!workflow_conversations_agent_id_fkey (
              name,
              skills (
                name,
                type
              )
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workflow logs:", error);
        throw error;
      }

      console.log("Fetched briefs:", data);
      return data;
    },
  });

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from("briefs")
        .delete()
        .in("id", selectedLogs);

      if (error) throw error;

      toast.success("Selected logs deleted successfully");
      setSelectedLogs([]);
    } catch (error) {
      console.error("Error deleting logs:", error);
      toast.error("Failed to delete logs");
    }
  };

  const toggleLogSelection = (briefId: string) => {
    setSelectedLogs(prev => 
      prev.includes(briefId)
        ? prev.filter(id => id !== briefId)
        : [...prev, briefId]
    );
  };

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
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Workflow Activity Log
          </CardTitle>
          {selectedLogs.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedLogs.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {briefs && briefs.length > 0 ? (
          <div className="space-y-8">
            {briefs.map((brief: any) => (
              <div key={brief.id} className="flex items-start gap-2">
                <Checkbox
                  checked={selectedLogs.includes(brief.id)}
                  onCheckedChange={() => toggleLogSelection(brief.id)}
                  className="mt-2"
                />
                <div className="flex-1">
                  <WorkflowLogItem brief={brief} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No workflow logs available
          </p>
        )}
      </CardContent>
    </Card>
  );
};