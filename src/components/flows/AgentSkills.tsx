import { Badge } from "@/components/ui/badge";
import { Brain, Code, Pencil } from "lucide-react";

interface AgentSkillsProps {
  skills?: any[];
}

export const AgentSkills = ({ skills }: AgentSkillsProps) => {
  if (!skills || skills.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'thinking':
        return <Brain className="h-3 w-3" />;
      case 'coding':
        return <Code className="h-3 w-3" />;
      default:
        return <Pencil className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill: any) => (
        <Badge 
          key={skill.name} 
          variant="secondary"
          className="flex items-center gap-1"
        >
          {getIcon(skill.type)}
          {skill.name}
        </Badge>
      ))}
    </div>
  );
};