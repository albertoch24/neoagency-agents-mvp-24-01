import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BriefForm from "@/components/brief/BriefForm";
import BriefDisplay from "@/components/brief/BriefDisplay";
import { WorkflowDisplay } from "@/components/workflow/WorkflowDisplay";
import { useSearchParams } from "react-router-dom";
import { BriefActions } from "@/components/brief/BriefActions";
import { BriefSelector } from "@/components/brief/BriefSelector";
import { useStageHandling } from "@/hooks/useStageHandling";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

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
      
      const newParams = new URLSearchParams(searchParams);
      newParams.set("briefId", briefIdFromUrl);
      newParams.set("showOutputs", "true");
      if (!searchParams.get("stage")) {
        newParams.set("stage", "kickoff");
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams.get("briefId")]);

  const { data: briefs, error: briefsError } = useQuery({
    queryKey: ["briefs", user?.id],
    queryFn: async () => {
      console.log("Fetching briefs for user:", user?.id);
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching briefs:", error);
        toast.error("Failed to fetch briefs");
        return [];
      }

      return data;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0
  });

  const { data: currentBrief, error: currentBriefError } = useQuery({
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
        console.error("Error fetching current brief:", error);
        toast.error("Failed to fetch brief details");
        return null;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0
  });

  const handleSelectBrief = (briefId: string) => {
    setSelectedBriefId(briefId);
    setShowNewBrief(false);
    setIsEditing(false);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set("briefId", briefId);
    newParams.set("showOutputs", "true");
    if (!searchParams.get("stage")) {
      newParams.set("stage", "kickoff");
    }
    setSearchParams(newParams);
  };

  if (briefsError || currentBriefError) {
    console.error("Error in briefs query:", briefsError || currentBriefError);
  }

  // Project list view when no brief is selected
  if (!selectedBriefId && !showNewBrief) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <Button
            onClick={() => setShowNewBrief(true)}
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
                    onClick={() => {
                      handleSelectBrief(brief.id);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectBrief(brief.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <BriefActions
          currentBrief={currentBrief}
          showNewBrief={showNewBrief}
          isEditing={isEditing}
          onNewBrief={() => {
            setShowNewBrief(true);
            setIsEditing(false);
          }}
          onEdit={() => setIsEditing(true)}
        />
        <BriefSelector 
          briefs={briefs || []} 
          onSelect={handleSelectBrief}
        />
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
              briefId={currentBrief?.id}
              currentStage={currentStage}
              onStageSelect={handleStageSelect}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;