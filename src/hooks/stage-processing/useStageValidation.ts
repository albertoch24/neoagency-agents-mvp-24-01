import { toast } from "sonner";

export const useStageValidation = () => {
  const validateStageData = (briefId?: string, stageId?: string) => {
    if (!briefId || !stageId) {
      console.error("❌ Missing required parameters:", { briefId, stageId });
      toast.error("Missing brief or stage ID");
      return false;
    }
    return true;
  };

  return { validateStageData };
};