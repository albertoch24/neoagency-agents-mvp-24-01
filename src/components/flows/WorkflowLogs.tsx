import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export const WorkflowLogs = () => {
  // Fetch all briefs and their related outputs and conversations
  const { data: logs, isLoading } = useQuery({
    queryKey: ["workflow-logs"],
    queryFn: async () => {
      const { data: briefs, error: briefsError } = await supabase
        .from("briefs")
        .select(`
          id,
          title,
          current_stage,
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
            agents!workflow_conversations_agent_id_fkey (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (briefsError) throw briefsError;
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

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Workflow Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {logs?.map((brief) => (
            <div key={brief.id} className="mb-8 border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">
                {brief.title}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Created: {format(new Date(brief.created_at), "PPpp")})
                </span>
              </h3>
              
              <div className="space-y-4">
                {/* Show outputs */}
                {brief.brief_outputs?.map((output: any) => (
                  <div key={output.created_at} className="pl-4 border-l-2">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(output.created_at), "PPpp")} - Stage: {output.stage}
                    </p>
                    <div className="mt-1">
                      <p className="text-sm">
                        Output from {output.content.agent_name}:
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {output.content.response}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Show conversations */}
                {brief.workflow_conversations?.map((conv: any) => (
                  <div key={conv.created_at} className="pl-4 border-l-2">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(conv.created_at), "PPpp")} - Stage: {conv.stage_id}
                    </p>
                    <div className="mt-1">
                      <p className="text-sm">
                        Message from {conv.agents?.name}:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conv.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};