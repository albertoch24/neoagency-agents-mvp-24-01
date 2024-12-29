import { Agent, Skill } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";

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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p>{agent.description || "No overview available."}</p>
          </div>
        );
      case "skills":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Skills</h3>
            <div className="flex flex-wrap gap-2">
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
          </div>
        );
      case "details":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Details</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Created:</span>{" "}
                {new Date(agent.created_at).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(agent.updated_at).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {agent.is_paused ? "Paused" : "Active"}
              </p>
            </div>
          </div>
        );
      case "info":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Information</h3>
            <p>Additional information about the agent will be displayed here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="p-4 flex-1">{renderContent()}</div>;
};