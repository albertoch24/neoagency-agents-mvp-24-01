import { Agent, Skill } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="p-4">
                {isExpanded ? (
                  <div className="whitespace-pre-wrap">
                    {agent.description || "No overview available."}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(false)}
                      className="mt-2 w-full flex items-center gap-2"
                    >
                      <ChevronUp className="h-4 w-4" />
                      Show less
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="line-clamp-3 whitespace-pre-wrap">
                      {agent.description || "No overview available."}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(true)}
                      className="mt-2 w-full flex items-center gap-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                      Show more
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      case "skills":
        return (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="flex flex-wrap gap-2 p-4">
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

  return <div className="flex-1 flex flex-col overflow-hidden">{renderContent()}</div>;
};