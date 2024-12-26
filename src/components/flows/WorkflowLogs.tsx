import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { WorkflowLogItem } from "./WorkflowLogItem";

export const WorkflowLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["workflow-logs"],
    queryFn: async () => {
      console.log("Fetching workflow logs...");
      const { data: briefs, error: briefsError } = await supabase
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
            agents (
              name,
              skills (
                name,
                type
              )
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (briefsError) {
        console.error("Error fetching briefs:", briefsError);
        throw briefsError;
      }

      console.log("Fetched briefs:", briefs);
      return briefs;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Workflow Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No workflow logs available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Workflow Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {logs.map((brief) => (
            <WorkflowLogItem key={brief.id} brief={brief} />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};