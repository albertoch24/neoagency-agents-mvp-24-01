import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface BriefSelectorProps {
  briefs: any[];
  onSelect: (briefId: string) => void;
}

export const BriefSelector = ({ briefs, onSelect }: BriefSelectorProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSelect = async (briefId: string) => {
    // First invalidate the queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["brief"] }),
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] }),
      queryClient.invalidateQueries({ queryKey: ["brief-outputs"] })
    ]);

    // Then navigate and call onSelect
    navigate(`/brief/${briefId}`);
    onSelect(briefId);
  };

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
            onClick={() => handleSelect(brief.id)}
          >
            {brief.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};