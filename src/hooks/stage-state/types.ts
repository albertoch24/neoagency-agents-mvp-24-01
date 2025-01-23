export interface StageState {
  isLoading: boolean;
  isCompleted: boolean;
  hasError: boolean;
  error: Error | null;
  stageData: StageData | null;
}

export interface StageData {
  outputs?: any[];
  conversations?: any[];
}