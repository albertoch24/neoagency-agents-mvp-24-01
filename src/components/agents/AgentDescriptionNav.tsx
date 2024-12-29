import { FileText, Info, List, AlignVerticalJustifyStart } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentDescriptionNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const AgentDescriptionNav = ({
  activeSection,
  onSectionChange,
}: AgentDescriptionNavProps) => {
  const sections = [
    {
      id: "overview",
      name: "Overview",
      icon: AlignVerticalJustifyStart,
    },
    {
      id: "details",
      name: "Details",
      icon: FileText,
    },
    {
      id: "skills",
      name: "Skills",
      icon: List,
    },
    {
      id: "info",
      name: "Information",
      icon: Info,
    },
  ];

  return (
    <nav className="flex flex-col space-y-1 min-w-[200px] p-4 border-r">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
            activeSection === section.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          )}
        >
          <section.icon className="h-4 w-4" />
          {section.name}
        </button>
      ))}
    </nav>
  );
};