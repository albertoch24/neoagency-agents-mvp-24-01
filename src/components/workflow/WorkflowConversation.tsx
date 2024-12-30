import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Database } from "@/integrations/supabase/database.types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type WorkflowConversation = Database["public"]["Tables"]["workflow_conversations"]["Row"] & {
  agents: {
    name: string;
    description: string;
  };
};

interface WorkflowConversationProps {
  briefId: string;
  currentStage: string;
}

export function WorkflowConversation({ briefId, currentStage }: WorkflowConversationProps) {
  const { data: conversations, refetch } = useQuery({
    queryKey: ["workflow-conversations", briefId, currentStage],
    queryFn: async () => {
      if (!briefId || !currentStage) {
        console.log("Missing required parameters:", { briefId, currentStage });
        return [];
      }

      console.log("Fetching conversations for:", { briefId, currentStage });

      // Get the conversations with the correct foreign key relationship specified
      const { data: conversations, error: conversationsError } = await supabase
        .from("workflow_conversations")
        .select(`
          *,
          agents!workflow_conversations_agent_id_fkey (
            name,
            description
          )
        `)
        .eq("brief_id", briefId)
        .eq("stage_id", currentStage)
        .order("created_at", { ascending: true });

      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError);
        return [];
      }

      console.log("Found conversations:", conversations);
      return conversations as WorkflowConversation[];
    },
    enabled: !!briefId && !!currentStage,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (!conversations?.length) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Team Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            The workflow agents are processing the brief for this stage. Please wait...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Team Discussion</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {conversations?.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-agent/30"
              >
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {conversation.agents?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-primary">
                      {conversation.agents?.name}
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="description">
                      <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-primary">
                        View Role Description
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-md">
                          {conversation.agents?.description}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <div className="mt-2 text-sm leading-relaxed bg-background p-4 rounded-md shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{conversation.content}</div>
                    </div>
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