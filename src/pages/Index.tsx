import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStage } from "@/types/workflow";
import BriefForm from "@/components/brief/BriefForm";
import BriefDisplay from "@/components/brief/BriefDisplay";
import WorkflowDisplay from "@/components/workflow/WorkflowDisplay";
import { Button } from "@/components/ui/button";
import { FilePlus, FolderOpen, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { user } = useAuth();
  const [currentStage, setCurrentStage] = useState("kickoff");
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: briefs } = useQuery({
    queryKey: ["briefs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching briefs:", error);
        return [];
      }

      return data;
    },
    enabled: !!user,
  });

  const { data: currentBrief, refetch: refetchCurrentBrief } = useQuery({
    queryKey: ["brief", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefs")
        .select("*, brief_outputs(*)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching brief:", error);
        return null;
      }

      return data;
    },
    enabled: !!user,
  });

  const handleStageSelect = (stage: WorkflowStage) => {
    setCurrentStage(stage.id);
  };

  const handleSelectBrief = async (briefId: string) => {
    await refetchCurrentBrief();
    setShowNewBrief(false);
    setIsEditing(false);
  };

  const handleEditBrief = () => {
    setIsEditing(true);
    setShowNewBrief(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setShowNewBrief(true);
              setIsEditing(false);
            }}
            className="flex items-center gap-2"
          >
            <FilePlus className="h-4 w-4" />
            Start with a new brief
          </Button>
          {currentBrief && !showNewBrief && !isEditing && (
            <Button
              onClick={handleEditBrief}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Brief
            </Button>
          )}
        </div>

        {briefs && briefs.length > 0 && (
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
                  onClick={() => handleSelectBrief(brief.id)}
                >
                  {brief.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {(showNewBrief || !currentBrief || isEditing) ? (
        <BriefForm 
          initialData={isEditing ? currentBrief : undefined}
          onSubmitSuccess={() => {
            setIsEditing(false);
            refetchCurrentBrief();
          }}
        />
      ) : (
        <div className="space-y-8">
          <BriefDisplay brief={currentBrief} />
          <WorkflowDisplay
            currentStage={currentStage}
            onStageSelect={handleStageSelect}
            briefId={currentBrief?.id}
          />
        </div>
      )}
    </div>
  );
};

export default Index;