import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OutputDisplay } from "./OutputDisplay";
import { OutputError } from "./OutputError";
import { OutputLoading } from "./OutputLoading";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface OutputContainerProps {
  briefId: string;
  stage: string;
}

interface BriefOutput {
  content: {
    outputs?: Array<{
      agent: string;
      stepId?: string;
      outputs: Array<{
        content: string;
        type?: string;
      }>;
      orderIndex?: number;
      requirements?: string;
    }>;
    [key: string]: any;
  };
}

export const OutputContainer = ({ briefId, stage }: OutputContainerProps) => {
  const { data: output, isLoading, error } = useQuery({
    queryKey: ["brief-outputs", briefId, stage],
    queryFn: async () => {
      console.log("🔍 Fetching output for:", {
        briefId,
        stage,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", stage)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching output:", error);
        toast.error("Error loading outputs");
        throw error;
      }

      console.log("📊 Full output data:", {
        found: !!data?.length,
        count: data?.length,
        data: data
      });

      if (!data || data.length === 0) {
        console.log("⚠️ No output data found");
        return null;
      }

      const latestOutput = data[0];
      console.log("Latest output:", latestOutput);

      // Handle the case where content is a string (JSON)
      let parsedContent: BriefOutput['content'];
      if (typeof latestOutput.content === 'string') {
        try {
          console.log("🔄 Attempting to parse string content");
          parsedContent = JSON.parse(latestOutput.content);
          console.log("✅ Successfully parsed content string");
        } catch (e) {
          console.error("❌ Error parsing content:", e);
          toast.error("Error parsing output content");
          throw new Error("Invalid content format");
        }
      } else {
        console.log("✅ Content is already an object");
        parsedContent = latestOutput.content as BriefOutput['content'];
      }

      console.log("🎯 Final parsed content structure:", {
        hasOutputs: !!parsedContent.outputs,
        outputsCount: parsedContent.outputs?.length,
        firstOutput: parsedContent.outputs?.[0] ? {
          agent: parsedContent.outputs[0].agent,
          hasStepId: !!parsedContent.outputs[0].stepId,
          outputsCount: parsedContent.outputs[0].outputs?.length
        } : null,
        fullContent: parsedContent
      });

      return {
        content: parsedContent
      };
    },
    enabled: !!briefId && !!stage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000
  });

  if (isLoading) return <OutputLoading />;
  if (error) return <OutputError error={error as Error} />;
  if (!output) return null;

  return <OutputDisplay output={output} />;
};