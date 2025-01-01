import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentSkills } from "./AgentSkills";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations }: AgentSequenceProps) => {
  return (
    <div className="space-y-4">
      {conversations.map((conv: any, index: number) => (
        <Card key={conv.created_at} className="overflow-hidden border-agent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <User className="h-5 w-5 text-agent" />
              <span className="font-semibold text-lg">
                {conv.agents?.name || 'Unknown Agent'}
              </span>
              <Badge variant="outline" className="ml-auto">
                Step {index + 1}
              </Badge>
            </div>
            
            <div className="pl-6 space-y-6">
              <div>
                <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skills Used:</h5>
                <AgentSkills skills={conv.agents?.skills} />
              </div>
              
              <div>
                <h5 className="text-sm font-medium mb-3 text-muted-foreground">Agent Output:</h5>
                <div className="bg-agent/5 rounded-lg p-6 shadow-sm">
                  <div className="prose prose-sm max-w-none dark:prose-invert 
                    prose-p:text-foreground/90 prose-headings:text-foreground
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-li:text-foreground/90 prose-a:text-primary
                    [&>p]:leading-7 [&>ul]:mt-4 [&>ul]:list-none [&>ul]:pl-0
                    [&>ul>li]:relative [&>ul>li]:pl-4">
                    <ReactMarkdown>{conv.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};