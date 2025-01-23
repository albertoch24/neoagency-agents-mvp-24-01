import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BriefValidationResult {
  isValid: boolean;
  brief?: any;
  error?: string;
}

export const validateBrief = async (briefId?: string): Promise<BriefValidationResult> => {
  console.log("🔍 Validating brief:", {
    briefId,
    timestamp: new Date().toISOString()
  });

  if (!briefId) {
    console.error("❌ No briefId provided for validation");
    return { isValid: false, error: "No brief ID provided" };
  }

  try {
    const { data: brief, error } = await supabase
      .from("briefs")
      .select(`
        *,
        brief_outputs (
          id,
          content,
          stage_id
        )
      `)
      .eq("id", briefId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error fetching brief:", {
        error,
        briefId,
        timestamp: new Date().toISOString()
      });
      return { isValid: false, error: error.message };
    }

    if (!brief) {
      console.error("❌ Brief not found:", {
        briefId,
        timestamp: new Date().toISOString()
      });
      return { isValid: false, error: "Brief not found" };
    }

    console.log("✅ Brief validation successful:", {
      briefId,
      hasOutputs: brief.brief_outputs?.length > 0,
      timestamp: new Date().toISOString()
    });

    return { isValid: true, brief };
  } catch (error: any) {
    console.error("❌ Unexpected error during brief validation:", {
      error,
      briefId,
      timestamp: new Date().toISOString()
    });
    return { isValid: false, error: error.message };
  }
};