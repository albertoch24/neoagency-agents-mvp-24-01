import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useParams } from "react-router-dom";

export const useBriefState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const params = useParams();
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [showOutputs, setShowOutputs] = useState(true);

  useEffect(() => {
    const briefIdFromUrl = params.briefId || searchParams.get("briefId");
    
    if (location.pathname === "/" && !briefIdFromUrl) {
      setSelectedBriefId(null);
      setShowNewBrief(false);
      setIsEditing(false);
      setShowOutputs(true);
      if (searchParams.toString()) {
        setSearchParams({});
      }
    } else if (briefIdFromUrl) {
      setSelectedBriefId(briefIdFromUrl);
      setShowNewBrief(false);
      setIsEditing(false);
      setShowOutputs(true);
    }
  }, [location.pathname, params.briefId, searchParams, setSearchParams]);

  const handleNewBrief = () => {
    setShowNewBrief(true);
    setIsEditing(false);
    setSelectedBriefId(null);
    setSearchParams({});
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmitSuccess = () => {
    setIsEditing(false);
    setSelectedBriefId(null);
    setSearchParams({});
  };

  const handleSelectBrief = (briefId: string) => {
    setSelectedBriefId(briefId);
    setShowNewBrief(false);
    setIsEditing(false);
    setShowOutputs(true);
  };

  return {
    showNewBrief,
    isEditing,
    selectedBriefId,
    showOutputs,
    handleNewBrief,
    handleEdit,
    handleSubmitSuccess,
    handleSelectBrief
  };
};