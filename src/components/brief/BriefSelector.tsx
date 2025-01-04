import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BriefSelectorProps {
  briefs: any[];
  onSelect: (briefId: string) => void;
}

export const BriefSelector = ({ briefs, onSelect }: BriefSelectorProps) => {
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
            onClick={() => onSelect(brief.id)}
          >
            {brief.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};