import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface Brief {
  id: string;
  title: string;
  current_stage: string;
}

interface ProjectListProps {
  briefs: Brief[];
  onSelect: (briefId: string) => void;
  onEdit: (briefId: string) => void;
  onNew: () => void;
}

export const ProjectList = ({ briefs, onSelect, onEdit, onNew }: ProjectListProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDelete = async (briefId: string) => {
    try {
      const { error } = await supabase
        .from("briefs")
        .delete()
        .eq("id", briefId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["briefs"] });
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting brief:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleView = (briefId: string) => {
    navigate(`/brief/${briefId}`);
    onSelect(briefId);
  };

  const handleEdit = (briefId: string) => {
    navigate(`/brief/${briefId}`);
    onEdit(briefId);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Button
          onClick={onNew}
          className="flex items-center gap-2"
        >
          Create New Project
        </Button>
      </div>
      <div className="grid gap-4">
        {briefs?.map((brief) => (
          <Card key={brief.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{brief.title}</h2>
                <p className="text-muted-foreground">
                  Stage: {brief.current_stage}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(brief.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(brief.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(brief.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {(!briefs || briefs.length === 0) && (
          <p className="text-center text-muted-foreground">No projects found</p>
        )}
      </div>
    </div>
  );
};