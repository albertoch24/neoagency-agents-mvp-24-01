export interface StageContext {
  previousStageContent?: any;
  validationResults?: {
    missingInfo: string[];
    unclearInfo: string[];
    suggestions: string[];
  };
}

export class ContextManager {
  private static instance: ContextManager;
  private context: Map<string, StageContext> = new Map();

  private constructor() {}

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  async loadPreviousStageContent(supabase: any, briefId: string, currentStageId: string): Promise<void> {
    try {
      const { data: previousOutput, error } = await supabase
        .from('brief_outputs')
        .select('*')
        .eq('brief_id', briefId)
        .eq('is_reprocessed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (previousOutput) {
        const context: StageContext = {
          previousStageContent: previousOutput.content,
          validationResults: validateFirstStageData(previousOutput.content)
        };
        this.context.set(currentStageId, context);
      }
    } catch (error) {
      console.error('Error loading previous stage content:', error);
      throw error;
    }
  }

  getContext(stageId: string): StageContext | undefined {
    return this.context.get(stageId);
  }
}