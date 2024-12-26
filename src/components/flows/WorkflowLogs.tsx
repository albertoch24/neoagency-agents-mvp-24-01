import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const WorkflowLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["workflow-logs"],
    queryFn: async () => {
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
        <CardTitle>Workflow Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {logs?.map((brief) => {
            // Group conversations by stage
            const conversationsByStage = brief.workflow_conversations?.reduce((acc: any, conv: any) => {
              if (!acc[conv.stage_id]) {
                acc[conv.stage_id] = [];
              }
              acc[conv.stage_id].push(conv);
              return acc;
            }, {});

            return (
              <div key={brief.id} className="mb-8 border-b pb-6">
                <h3 className="text-lg font-semibold mb-2">
                  {brief.title}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Created: {format(new Date(brief.created_at), "PPpp")})
                  </span>
                </h3>
                
                <div className="space-y-6">
                  {Object.entries(conversationsByStage || {}).map(([stage, conversations]: [string, any]) => (
                    <div key={stage} className="pl-4 border-l-2">
                      <h4 className="font-medium mb-2">Stage: {stage}</h4>
                      
                      {/* Display agents in sequence */}
                      <div className="space-y-4">
                        {conversations.map((conv: any, index: number) => (
                          <div key={conv.created_at} className="pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {conv.agents?.name}
                              </span>
                              <Badge variant="outline">Step {index + 1}</Badge>
                            </div>
                            
                            {/* Display agent skills */}
                            {conv.agents?.skills && conv.agents.skills.length > 0 && (
                              <div className="mb-2">
                                <p className="text-sm text-muted-foreground">Skills used:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {conv.agents.skills.map((skill: any) => (
                                    <Badge key={skill.name} variant="secondary">
                                      {skill.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Display outputs for this stage */}
                      {brief.brief_outputs?.filter((output: any) => output.stage === stage).map((output: any) => (
                        <div key={output.created_at} className="mt-4">
                          <p className="text-sm font-medium">Required Output:</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {output.content.response}
                          </p>
                        </div>
                      ))}
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