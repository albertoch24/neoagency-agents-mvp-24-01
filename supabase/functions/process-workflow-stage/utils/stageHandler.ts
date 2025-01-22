export async function getStageData(supabase: any, stageId: string) {
  const { data: stage, error: stageError } = await supabase
    .from('stages')
    .select('*, flows!inner(id, name)')
    .eq('id', stageId)
    .maybeSingle();

  if (stageError || !stage) {
    throw new Error(`Error fetching stage: ${stageError?.message || 'Stage not found'}`);
  }

  return stage;
}