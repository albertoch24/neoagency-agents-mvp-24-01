import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";

interface BriefProjectsMenuProps {
  briefs: any[];
  onSelectBrief: (briefId: string) => void;
}

export const BriefProjectsMenu = ({ briefs, onSelectBrief }: BriefProjectsMenuProps) => {
  if (!briefs || briefs.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Projects
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {briefs.map((brief) => (
          <DropdownMenuItem
            key={brief.id}
            onClick={() => onSelectBrief(brief.id)}
          >
            {brief.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};