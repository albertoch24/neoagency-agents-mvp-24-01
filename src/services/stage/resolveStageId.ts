import { supabase } from "@/integrations/supabase/client";

export const resolveStageId = async (stageId: string): Promise<string> => {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stageId)) {
    return stageId;
  }

  console.log('Fetching actual stage ID for:', stageId);
  
  // Try exact match first
  let { data: stageData, error: stageError } = await supabase
    .from('stages')
    .select('id')
    .eq('name', stageId)
    .maybeSingle();

  // If no exact match, try with capitalized first letters
  if (!stageData) {
    const capitalizedName = stageId
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
      
    console.log('Trying with capitalized name:', capitalizedName);
    
    const result = await supabase
      .from('stages')
      .select('id')
      .eq('name', capitalizedName)
      .maybeSingle();
      
    stageData = result.data;
    stageError = result.error;
  }

  if (stageError) {
    console.error("❌ Error fetching stage:", stageError);
    throw new Error("Failed to find stage");
  }

  if (!stageData) {
    console.error("❌ Stage not found:", stageId);
    throw new Error(`Stage not found: ${stageId}. Please check the stage name.`);
  }

  console.log('Found actual stage ID:', stageData.id);
  return stageData.id;
};