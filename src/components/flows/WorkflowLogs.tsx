import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, History } from "lucide-react";
import { WorkflowLogItem } from "./WorkflowLogItem";

export const WorkflowLogs = () => {
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
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Workflow Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {briefs && briefs.length > 0 ? (
          <div className="space-y-8">
            {briefs.map((brief: any) => (
              <WorkflowLogItem key={brief.id} brief={brief} />
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