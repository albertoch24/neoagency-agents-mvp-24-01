import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OutputDisplay } from "./OutputDisplay";
import { OutputError } from "./OutputError";
import { OutputLoading } from "./OutputLoading";
import { Json } from "@/integrations/supabase/types";

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
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("❌ Error fetching output:", error);
        throw error;
      }

      console.log("📊 Raw output data:", {
        found: !!data?.length,
        count: data?.length,
        firstItem: data?.[0] ? {
          id: data[0].id,
          brief_id: data[0].brief_id,
          stage: data[0].stage,
          hasContent: !!data[0].content,
          contentType: typeof data[0].content,
          contentSample: JSON.stringify(data[0].content).substring(0, 100)
        } : null
      });

      if (!data || data.length === 0) {
        console.log("⚠️ No output data found");
        return null;
      }

      // Handle the case where content is a string (JSON)
      let parsedContent: BriefOutput['content'];
      if (typeof data[0].content === 'string') {
        try {
          console.log("🔄 Attempting to parse string content");
          parsedContent = JSON.parse(data[0].content);
          console.log("✅ Successfully parsed content string");
        } catch (e) {
          console.error("❌ Error parsing content:", e);
          throw new Error("Invalid content format");
        }
      } else {
        console.log("✅ Content is already an object");
        parsedContent = data[0].content as BriefOutput['content'];
      }

      console.log("🎯 Final parsed content structure:", {
        hasOutputs: !!parsedContent.outputs,
        outputsCount: parsedContent.outputs?.length,
        firstOutput: parsedContent.outputs?.[0] ? {
          agent: parsedContent.outputs[0].agent,
          hasStepId: !!parsedContent.outputs[0].stepId,
          outputsCount: parsedContent.outputs[0].outputs?.length
        } : null
      });

      return {
        content: parsedContent
      };
    },
    enabled: !!briefId && !!stage
  });

  if (isLoading) return <OutputLoading />;
  if (error) return <OutputError error={error as Error} />;
  if (!output) return null;

  return <OutputDisplay output={output} />;
};