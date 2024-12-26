import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentSkills } from "./AgentSkills";

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations }: AgentSequenceProps) => {
  return (
    <div className="space-y-4">
      {conversations.map((conv: any, index: number) => (
        <div key={conv.created_at} className="pl-4 border-l-2 border-muted">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">
              {conv.agents?.name}
            </span>
            <Badge variant="outline">Step {index + 1}</Badge>
          </div>
          
          <div className="pl-6">
            <h5 className="text-sm font-medium mb-2">Skills Used:</h5>
            <AgentSkills skills={conv.agents?.skills} />
            
            <h5 className="text-sm font-medium mt-4 mb-2">Agent Output:</h5>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {conv.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};