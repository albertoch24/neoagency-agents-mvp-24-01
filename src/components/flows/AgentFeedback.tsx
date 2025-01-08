import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

interface AgentFeedbackProps {
  conversationId: string;
}

export const AgentFeedback = ({ conversationId }: AgentFeedbackProps) => {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ["agent-feedback", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_feedback")
        .select(`
          *,
          reviewer:agents!reviewer_agent_id (
            name
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading feedback...</div>;
  }

  if (!feedback?.length) {
    return null;
  }

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {feedback.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.reviewer.name}</Badge>
                <div className="flex items-center">
                  {Array.from({ length: item.rating || 0 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{item.content}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};