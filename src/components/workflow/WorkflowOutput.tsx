import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { marked } from "marked";

interface WorkflowOutputProps {
  briefId: string;
  stageId: string;
}

interface StageOutput {
  stage_name: string;
  outputs: Array<{
    agent: string;
    requirements?: string;
    outputs: Array<{
      content: string;
    }>;
    stepId: string;
    orderIndex: number;
  }>;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  const { data: outputs } = useQuery({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      console.log("Fetching outputs for stage:", stageId);
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", stageId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching outputs:", error);
        return [];
      }

      console.log("Found outputs:", data);
      return data;
    },
    enabled: !!briefId && !!stageId,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  });

  const formatText = (text: string) => {
    const preparedText = text
      .replace(/###|####/g, '')
      .replace(/\*\*/g, '*')
      .replace(/^-\s/gm, '• ')
      .trim();

    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    const htmlContent = marked(preparedText);

    return (
      <div 
        className="prose prose-gray max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    );
  };

  if (!outputs?.length) {
    return null;
  }

  return (
    <Card className="w-full bg-background shadow-lg">
      <CardContent className="p-8">
        <ScrollArea className="h-[600px] pr-6">
          <div className="space-y-12">
            {outputs.map((output) => {
              // Safely cast the content to StageOutput type
              const content = output.content as any;
              const stageOutput: StageOutput = {
                stage_name: content.stage_name || 'Stage Output',
                outputs: Array.isArray(content.outputs) ? content.outputs.map((out: any) => ({
                  agent: out.agent || 'Unknown Agent',
                  requirements: out.requirements,
                  outputs: Array.isArray(out.outputs) ? out.outputs : [],
                  stepId: out.stepId || '',
                  orderIndex: out.orderIndex || 0
                })) : []
              };

              return (
                <div key={output.id} className="space-y-8">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {stageOutput.stage_name}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(output.created_at), "PPpp")}
                    </span>
                  </div>
                  
                  <div className="text-foreground">
                    {stageOutput.outputs?.map((agentOutput, index) => (
                      <div key={index} className="mt-8">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem 
                            value={`agent-${index}`} 
                            className="border rounded-lg shadow-sm bg-card/50 backdrop-blur-sm"
                          >
                            <AccordionTrigger className="px-6 py-4 text-xl font-semibold hover:no-underline data-[state=open]:text-primary">
                              {agentOutput.agent}
                              {agentOutput.requirements && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                  ({agentOutput.requirements})
                                </span>
                              )}
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                              <div className="prose prose-sm max-w-none">
                                <div className="rounded-md bg-muted/30 p-6 backdrop-blur-sm">
                                  {agentOutput.outputs?.map((output, outputIndex) => (
                                    <div key={outputIndex} className="mb-8 last:mb-0">
                                      {formatText(output.content)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};