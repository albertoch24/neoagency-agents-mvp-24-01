import { useQuery } from "@tanstack/react-query";
import { StageData } from "./types";
import { fetchBrief, fetchOutputs, fetchConversations } from "./utils/dataFetchers";
import { validateStageIds } from "./utils/stageValidation";
import { logQuery } from "./utils/queryLogger";

export const useStageQueries = (briefId?: string, stageId?: string) => {
  return useQuery({
    queryKey: ["stage-state", briefId, stageId],
    queryFn: async () => {
      logQuery.info('Starting stage state check', {
        briefId,
        stageId,
        cacheKey: ["stage-state", briefId, stageId]
      });

      if (!briefId || !stageId) {
        throw new Error('Missing briefId or stageId');
      }

      // Verify brief exists
      await fetchBrief(briefId);

      // Fetch outputs and conversations
      const outputs = await fetchOutputs(briefId, stageId);
      const conversations = await fetchConversations(briefId, stageId);

      // Validate stage ID consistency
      validateStageIds(stageId, outputs, conversations);

      return {
        outputs,
        conversations
      } as StageData;
    },
    enabled: !!briefId && !!stageId,
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 3,
    meta: {
      errorHandler: (error: Error) => {
        logQuery.error('Query error', {
          error,
          briefId,
          stageId
        });
      }
    }
  });
};