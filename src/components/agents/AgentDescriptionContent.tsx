import { Agent, Skill } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentDescriptionContentProps {
  agent: Agent;
  activeSection: string;
  editingSkill: Skill | null;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  onUpdateSkill: (skill: Skill) => void;
}

export const AgentDescriptionContent = ({
  agent,
  activeSection,
  editingSkill,
  onEditSkill,
  onDeleteSkill,
  onUpdateSkill,
}: AgentDescriptionContentProps) => {
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="h-[350px]">
            <ScrollArea className="h-full">
              <div className="px-4">
                <p className="whitespace-pre-wrap">{agent.description || "No overview available."}</p>
              </div>
            </ScrollArea>
          </div>
        );
      case "skills":
        return (
          <div className="h-[350px]">
            <ScrollArea className="h-full">
              <div className="flex flex-wrap gap-2 px-4">
                {agent.skills?.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-1">
                    {editingSkill?.id === skill.id ? (
                      <Input
                        value={editingSkill.name}
                        onChange={(e) =>
                          onUpdateSkill({ ...editingSkill, name: e.target.value })
                        }
                        className="h-6 w-32 text-sm"
                      />
                    ) : (
                      <Badge variant="outline" className="pr-1">
                        {skill.name}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditSkill(skill)}
                      className="h-4 w-4 p-0"
                    >
                      {editingSkill?.id === skill.id ? (
                        <Save className="h-3 w-3" />
                      ) : (
                        <Edit2 className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteSkill(skill.id)}
                      className="h-4 w-4 p-0 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="flex-1 overflow-hidden p-4">{renderContent()}</div>;
};