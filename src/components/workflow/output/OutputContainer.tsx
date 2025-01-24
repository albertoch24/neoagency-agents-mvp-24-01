import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OutputDisplay } from "./OutputDisplay";
import { OutputError } from "./OutputError";
import { OutputLoading } from "./OutputLoading";
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

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const OutputContainer = ({ briefId, stage }: OutputContainerProps) => {
  const { data: output, isLoading, error } = useQuery({
    queryKey: ["brief-outputs", briefId, stage],
    queryFn: async () => {
      console.log("🔍 Fetching output for:", {
        briefId,
        stage,
        isUuid: isUUID(stage),
        timestamp: new Date().toISOString()
      });
      
      let query = supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId);

      // If stage is a UUID, use stage_id, otherwise use stage field
      if (isUUID(stage)) {
        query = query.eq("stage_id", stage);
        console.log("🔍 Using stage_id for query");
      } else {
        query = query.eq("stage", stage);
        console.log("🔍 Using stage field for query");
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching output:", error);
        toast.error("Error loading outputs");
        throw error;
      }

      console.log("📊 Raw output data:", {
        found: !!data,
        data: data,
        contentSample: data ? JSON.stringify(data.content).substring(0, 100) : null,
        timestamp: new Date().toISOString()
      });

      if (!data) {
        console.log("⚠️ No output data found");
        return null;
      }

      // Handle both array and object formats for outputs
      let parsedContent: BriefOutput['content'];
      if (typeof data.content === 'string') {
        try {
          console.log("🔄 Attempting to parse string content");
          parsedContent = JSON.parse(data.content);
          console.log("✅ Successfully parsed content string");
        } catch (e) {
          console.error("❌ Error parsing content:", e);
          toast.error("Error parsing output content");
          throw new Error("Invalid content format");
        }
      } else {
        console.log("✅ Content is already an object");
        parsedContent = data.content as BriefOutput['content'];
      }

      // Ensure outputs array exists and has the correct format
      if (!parsedContent.outputs) {
        console.log("⚠️ No outputs array in content, creating default structure");
        parsedContent.outputs = [{
          agent: "System",
          outputs: [{
            content: typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)
          }]
        }];
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
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchInterval: 5000 // Refetch every 5 seconds
  });

  if (isLoading) return <OutputLoading />;
  if (error) return <OutputError error={error as Error} />;
  if (!output) return null;

  return <OutputDisplay output={output} />;
};