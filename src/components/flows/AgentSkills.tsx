import { Badge } from "@/components/ui/badge";

interface AgentSkillsProps {
  skills?: { name: string; type: string }[];
}

export const AgentSkills = ({ skills }: AgentSkillsProps) => {
  if (!skills?.length) return null;

  return (
    <div className="mb-2">
      <p className="text-sm text-muted-foreground">Skills used:</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {skills.map((skill) => (
          <Badge key={skill.name} variant="secondary">
            {skill.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};