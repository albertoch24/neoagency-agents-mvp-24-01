import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentSkills } from "./AgentSkills";
import { Card, CardContent } from "@/components/ui/card";

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations }: AgentSequenceProps) => {
  return (
    <div className="space-y-4">
      {conversations.map((conv: any, index: number) => (
        <Card key={conv.created_at}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              <span className="font-medium">
                {conv.agents?.name || 'Unknown Agent'}
              </span>
              <Badge variant="outline">Step {index + 1}</Badge>
            </div>
            
            <div className="pl-6">
              <h5 className="text-sm font-medium mb-2">Skills Used:</h5>
              <AgentSkills skills={conv.agents?.skills} />
              
              <h5 className="text-sm font-medium mt-4 mb-2">Agent Output:</h5>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {conv.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};