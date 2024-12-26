import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface WorkflowConversationProps {
  briefId: string;
  currentStage: string;
}

export function WorkflowConversation({ briefId, currentStage }: WorkflowConversationProps) {
  const { data: conversations, refetch } = useQuery({
    queryKey: ["workflow-conversations", briefId, currentStage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_conversations")
        .select(`
          *,
          agents (name, description)
        `)
        .eq("brief_id", briefId)
        .eq("stage_id", currentStage)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Refetch conversations every 5 seconds while the workflow is processing
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Team Discussion</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {conversations?.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-start gap-4"
              >
                <Avatar>
                  <AvatarFallback>
                    {conversation.agents?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {conversation.agents?.name}
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {conversation.agents?.description}
                  </p>
                  <div className="mt-2 text-sm">
                    {conversation.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}