import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBriefData = (userId: string | undefined, selectedBriefId: string | null) => {
  const { data: briefs, error: briefsError } = useQuery({
    queryKey: ["briefs", userId],
    queryFn: async () => {
      console.log("Fetching briefs for user:", userId);
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching briefs:", error);
        return [];
      }

      console.log("Fetched briefs:", data);
      return data;
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0
  });

  const { data: currentBrief, error: currentBriefError } = useQuery({
    queryKey: ["brief", selectedBriefId || "latest", userId],
    queryFn: async () => {
      console.log("Fetching current brief. Selected ID:", selectedBriefId);
      const query = supabase
        .from("briefs")
        .select("*, brief_outputs(*)")
        .eq("user_id", userId);

      if (selectedBriefId) {
        query.eq("id", selectedBriefId);
      } else {
        query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error("Error fetching current brief:", error);
        return null;
      }

      console.log("Fetched current brief:", data);
      return data;
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0
  });

  return {
    briefs,
    currentBrief,
    briefsError,
    currentBriefError
  };
};