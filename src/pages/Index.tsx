import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { useStageHandling } from "@/hooks/useStageHandling";
import { toast } from "sonner";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  
  const { currentStage, handleStageSelect } = useStageHandling(selectedBriefId);

  // Initialize state from URL parameters
  useEffect(() => {
    const briefIdFromUrl = searchParams.get("briefId");
    if (briefIdFromUrl) {
      setSelectedBriefId(briefIdFromUrl);
      setShowNewBrief(false);
      setIsEditing(false);
      
      // Ensure showOutputs is set to true when loading a brief
      const newParams = new URLSearchParams(searchParams);
      newParams.set("briefId", briefIdFromUrl);
      newParams.set("showOutputs", "true");
      if (!searchParams.get("stage")) {
        newParams.set("stage", "kickoff"); // Set default stage if none specified
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams.get("briefId")]);

  const { data: briefs, error: briefsError } = useQuery({
    queryKey: ["briefs", user?.id],
    queryFn: async () => {
      try {
        console.log("Fetching briefs for user:", user?.id);
        const { data, error } = await supabase
          .from("briefs")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching briefs:", error);
          throw error;
        }

        console.log("Fetched briefs:", data);
        return data;
      } catch (error) {
        console.error("Error fetching briefs:", error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    retry: 3,
  });

  const { data: currentBrief, error: currentBriefError } = useQuery({
    queryKey: ["brief", selectedBriefId || "latest", user?.id],
    queryFn: async () => {
      try {
        console.log("Fetching brief:", selectedBriefId);
        const query = supabase
          .from("briefs")
          .select(`
            *,
            brief_outputs (
              id,
              stage,
              content,
              stage_summary,
              created_at
            )
          `)
          .eq("user_id", user?.id);

        if (selectedBriefId) {
          query.eq("id", selectedBriefId);
        } else {
          query.order("created_at", { ascending: false });
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (error) {
          console.error("Error fetching brief:", error);
          throw error;
        }

        console.log("Fetched brief:", data);
        return data;
      } catch (error) {
        console.error("Error fetching brief:", error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    retry: 3,
  });

  // Handle errors
  useEffect(() => {
    if (briefsError) {
      console.error("Briefs error:", briefsError);
      toast.error("Failed to load briefs. Please try again.");
    }
    if (currentBriefError) {
      console.error("Current brief error:", currentBriefError);
      toast.error("Failed to load brief details. Please try again.");
    }
  }, [briefsError, currentBriefError]);

  const handleSelectBrief = (briefId: string) => {
    setSelectedBriefId(briefId);
    setShowNewBrief(false);
    setIsEditing(false);
    
    // Update URL parameters ensuring outputs are visible
    const newParams = new URLSearchParams(searchParams);
    newParams.set("briefId", briefId);
    newParams.set("showOutputs", "true");
    if (!searchParams.get("stage")) {
      newParams.set("stage", "kickoff");
    }
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