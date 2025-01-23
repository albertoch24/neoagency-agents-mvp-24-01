export interface StageState {
  isLoading: boolean;
  isCompleted: boolean;
  hasError: boolean;
  error: Error | null;
  stageData: {
    outputs?: any[];
    conversations?: any[];
  } | null;
}