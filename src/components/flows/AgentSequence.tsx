import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentSkills } from "./AgentSkills";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations }: AgentSequenceProps) => {
  // Group conversations by agent and type
  const groupedConversations = conversations.reduce((acc: any, conv: any) => {
    const agentId = conv.agent_id;
    if (!acc[agentId]) {
      acc[agentId] = {
        agent: conv.agents,
        conversational: null,
        summary: null
      };
    }
    if (conv.output_type === 'conversational') {
      acc[agentId].conversational = conv;
    } else if (conv.output_type === 'summary') {
      acc[agentId].summary = conv;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.values(groupedConversations).map((group: any, index: number) => (
        <Card key={group.agent.id} className="overflow-hidden border-agent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <User className="h-5 w-5 text-agent" />
              <span className="font-semibold text-lg">
                {group.agent?.name || 'Unknown Agent'}
              </span>
              <Badge variant="outline" className="ml-auto">
                Step {index + 1}
              </Badge>
            </div>
            
            <div className="pl-6 space-y-6">
              <div>
                <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skills Used:</h5>
                <AgentSkills skills={group.agent?.skills} />
              </div>
              
              {group.conversational && (
                <div>
                  <h5 className="text-sm font-medium mb-3 text-muted-foreground">Agent Output:</h5>
                  <div className="bg-agent/5 rounded-lg p-6 shadow-sm">
                    <div className="prose prose-sm max-w-none dark:prose-invert 
                      prose-p:text-foreground/90 prose-headings:text-foreground
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-li:text-foreground/90 prose-a:text-primary
                      [&>p]:leading-7 [&>ul]:mt-4 [&>ul]:list-none [&>ul]:pl-0
                      [&>ul>li]:relative [&>ul>li]:pl-4">
                      <ReactMarkdown>{group.conversational.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {group.summary && (
                <div>
                  <h5 className="text-sm font-medium mb-3 text-muted-foreground">Summary:</h5>
                  <div className="bg-muted rounded-lg p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{group.summary.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};