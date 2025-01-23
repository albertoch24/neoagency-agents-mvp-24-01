export interface StageState {
  isLoading: boolean;
  isCompleted: boolean;
  hasError: boolean;
  error: Error | null;
}

export interface StageData {
  outputs?: any[];
  conversations?: any[];
}