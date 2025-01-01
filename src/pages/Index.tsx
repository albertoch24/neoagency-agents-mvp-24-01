import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStage } from "@/types/workflow";
import BriefForm from "@/components/brief/BriefForm";
import BriefDisplay from "@/components/brief/BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";
import { Button } from "@/components/ui/button";
import { FilePlus, FolderOpen, Edit } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentStage, setCurrentStage] = useState<string>("kickoff");
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);

  // Read stage and briefId from URL params on mount and when URL changes
  useEffect(() => {
    const stageFromUrl = searchParams.get("stage");
    const briefIdFromUrl = searchParams.get("briefId");
    const showOutputs = searchParams.get("showOutputs");
    
    if (briefIdFromUrl) {
      setSelectedBriefId(briefIdFromUrl);
      // If showOutputs is true, ensure we're showing the brief display
      if (showOutputs === "true") {
        setShowNewBrief(false);
        setIsEditing(false);
        // Automatically set currentStage to "kickoff" when showOutputs is true
        setCurrentStage("kickoff");
        // Update URL to reflect the kickoff stage
        const newParams = new URLSearchParams(searchParams);
        newParams.set("stage", "kickoff");
        setSearchParams(newParams);
      }
    }
    
    // Only update stage from URL if showOutputs is not true
    if (stageFromUrl && showOutputs !== "true") {
      setCurrentStage(stageFromUrl);
    }
  }, [searchParams]);

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
    staleTime: 0,  // Always fetch fresh data
    gcTime: 0   // Don't cache the data
  });

  const { data: currentBrief } = useQuery({
    queryKey: ["brief", selectedBriefId || "latest", user?.id],
    queryFn: async () => {
      const query = supabase
        .from("briefs")
        .select("*, brief_outputs(*)")
        .eq("user_id", user?.id);

      if (selectedBriefId) {
        query.eq("id", selectedBriefId);
      } else {
        query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error("Error fetching brief:", error);
        return null;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 0,  // Always fetch fresh data
    gcTime: 0   // Don't cache the data
  });

  const handleStageSelect = (stage: WorkflowStage) => {
    setCurrentStage(stage.id);
    // Update URL with new stage while preserving briefId and showOutputs
    const newParams = new URLSearchParams(searchParams);
    newParams.set("stage", stage.id);
    setSearchParams(newParams);
  };

  const handleSelectBrief = (briefId: string) => {
    setSelectedBriefId(briefId);
    setShowNewBrief(false);
    setIsEditing(false);
    // Update URL with selected brief while preserving stage
    const newParams = new URLSearchParams(searchParams);
    newParams.set("briefId", briefId);
    setSearchParams(newParams);
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
              onClick={() => setIsEditing(true)}
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
            setSelectedBriefId(null);
          }}
        />
      ) : (
        <>
          <BriefDisplay brief={currentBrief} />
          <div className="-mx-4">
            <WorkflowDisplay
              currentStage={currentStage}
              onStageSelect={handleStageSelect}
              briefId={currentBrief?.id}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;