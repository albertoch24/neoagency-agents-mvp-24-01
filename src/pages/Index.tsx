import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSearchParams } from "react-router-dom";
import { BriefSection } from "@/components/brief/BriefSection";
import { BriefActions } from "@/components/brief/BriefActions";
import { BriefProjectsMenu } from "@/components/brief/BriefProjectsMenu";
import { useBriefData } from "@/hooks/useBriefData";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);

  const {
    briefs,
    currentBrief,
    briefsError,
    currentBriefError
  } = useBriefData(user?.id, selectedBriefId);

  // Initialize state from URL parameters
  useEffect(() => {
    const briefIdFromUrl = searchParams.get("briefId");
    if (briefIdFromUrl) {
      console.log("Brief ID from URL:", briefIdFromUrl);
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

  const handleSelectBrief = (briefId: string) => {
    console.log("Selecting brief:", briefId);
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

  if (briefsError || currentBriefError) {
    console.error("Errors:", { briefsError, currentBriefError });
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
        <BriefProjectsMenu
          briefs={briefs || []}
          onSelectBrief={handleSelectBrief}
        />
      </div>

      <BriefSection
        currentBrief={currentBrief}
        showNewBrief={showNewBrief}
        isEditing={isEditing}
        onEditComplete={() => {
          setIsEditing(false);
          setSelectedBriefId(null);
        }}
      />
    </div>
  );
};

export default Index;