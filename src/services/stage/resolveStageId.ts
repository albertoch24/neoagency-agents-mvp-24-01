import { supabase } from "@/integrations/supabase/client";

export const resolveStageId = async (stageIdentifier: string): Promise<string> => {
  // If it looks like a UUID, return it directly
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(stageIdentifier)) {
    console.log("✅ Using provided UUID:", stageIdentifier);
    return stageIdentifier;
  }

  console.log("🔍 Resolving stage name to ID:", stageIdentifier);

  try {
    // Try to find the stage by name (case insensitive)
    const { data: stages, error } = await supabase
      .from("stages")
      .select("id, name")
      .ilike("name", stageIdentifier)
      .limit(1);

    if (error) {
      console.error("❌ Error resolving stage ID:", error);
      throw error;
    }

    if (!stages || stages.length === 0) {
      console.error("❌ No stage found for identifier:", stageIdentifier);
      throw new Error(`No stage found for: ${stageIdentifier}`);
    }

    console.log("✅ Resolved stage ID:", {
      name: stages[0].name,
      id: stages[0].id
    });

    return stages[0].id;
  } catch (error) {
    console.error("❌ Failed to resolve stage ID:", error);
    throw error;
  }
};