import { Button } from "@/components/ui/button";

interface AgentDescriptionNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const AgentDescriptionNav = ({
  activeSection,
  onSectionChange,
}: AgentDescriptionNavProps) => {
  return (
    <div className="flex border-b">
      <Button
        variant="ghost"
        className={`flex-1 rounded-none ${
          activeSection === "overview" ? "border-b-2 border-primary" : ""
        }`}
        onClick={() => onSectionChange("overview")}
      >
        Overview
      </Button>
      <Button
        variant="ghost"
        className={`flex-1 rounded-none ${
          activeSection === "skills" ? "border-b-2 border-primary" : ""
        }`}
        onClick={() => onSectionChange("skills")}
      >
        Skills
      </Button>
    </div>
  );
};