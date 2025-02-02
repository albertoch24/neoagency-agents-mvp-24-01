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
      console.log("🔍 Starting output fetch:", {
        briefId,
        stage,
        isUuid: isUUID(stage),
        timestamp: new Date().toISOString(),
        queryKey: ["brief-outputs", briefId, stage]
      });
      
      let query = supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId);

      if (isUUID(stage)) {
        query = query.eq("stage_id", stage);
        console.log("🔍 Using stage_id for query");
      } else {
        query = query.eq("stage", stage);
        console.log("🔍 Using stage field for query");
      }

      console.log("📊 Executing query:", {
        briefId,
        stage,
        queryConfig: {
          table: "brief_outputs",
          filters: {
            brief_id: briefId,
            stage_id: isUUID(stage) ? stage : undefined,
            stage: !isUUID(stage) ? stage : undefined
          }
        }
      });

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching output:", {
          error,
          briefId,
          stage,
          timestamp: new Date().toISOString()
        });
        toast.error("Error loading outputs");
        throw error;
      }

      console.log("📊 Query result:", {
        found: !!data,
        resultType: data ? typeof data : 'undefined',
        hasContent: data?.content ? 'yes' : 'no',
        contentType: data?.content ? typeof data.content : 'undefined',
        timestamp: new Date().toISOString()
      });

      if (!data) {
        console.log("⚠️ No output data found", {
          briefId,
          stage,
          timestamp: new Date().toISOString()
        });
        return null;
      }

      let parsedContent: BriefOutput['content'];
      if (typeof data.content === 'string') {
        try {
          console.log("🔄 Parsing string content");
          parsedContent = JSON.parse(data.content);
          console.log("✅ Content parsed successfully:", {
            hasOutputs: !!parsedContent.outputs,
            outputsCount: parsedContent.outputs?.length || 0
          });
        } catch (e) {
          console.error("❌ Error parsing content:", {
            error: e,
            content: data.content.substring(0, 100) + '...',
            timestamp: new Date().toISOString()
          });
          toast.error("Error parsing output content");
          throw new Error("Invalid content format");
        }
      } else {
        console.log("✅ Content is already an object");
        parsedContent = data.content as BriefOutput['content'];
      }

      if (!parsedContent.outputs) {
        console.log("⚠️ Creating default output structure");
        parsedContent.outputs = [{
          agent: "System",
          outputs: [{
            content: typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)
          }]
        }];
      }

      console.log("🎯 Final output structure:", {
        hasOutputs: !!parsedContent.outputs,
        outputsCount: parsedContent.outputs?.length || 0,
        firstAgent: parsedContent.outputs?.[0]?.agent,
        outputTypes: parsedContent.outputs?.map(o => ({
          agent: o.agent,
          outputCount: o.outputs?.length || 0
        })),
        timestamp: new Date().toISOString()
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

  console.log("🔄 OutputContainer render state:", {
    briefId,
    stage,
    hasOutput: !!output,
    isLoading,
    hasError: !!error,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    console.log("⏳ Loading output...", {
      briefId,
      stage,
      timestamp: new Date().toISOString()
    });
    return <OutputLoading />;
  }

  if (error) {
    console.error("❌ Error in output display:", {
      error,
      briefId,
      stage,
      timestamp: new Date().toISOString()
    });
    return <OutputError error={error as Error} />;
  }

  if (!output) {
    console.log("⚠️ No output to display", {
      briefId,
      stage,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  console.log("✅ Rendering output:", {
    briefId,
    stage,
    outputContent: {
      hasOutputs: !!output.content.outputs,
      outputsCount: output.content.outputs?.length || 0
    },
    timestamp: new Date().toISOString()
  });

  return <OutputDisplay output={output} />;
};