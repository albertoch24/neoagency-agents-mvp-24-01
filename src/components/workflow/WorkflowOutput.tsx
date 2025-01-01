import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BriefOutput } from "@/types/workflow";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface WorkflowOutputProps {
  briefId: string;
  stageId: string;
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
      return data as BriefOutput[];
    },
    enabled: !!briefId && !!stageId,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  });

  if (!outputs?.length) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-8">
            {outputs.map((output) => (
              <div key={output.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-primary">
                    {output.content.stage_name || 'Stage Output'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(output.created_at), "PPpp")}
                  </span>
                </div>
                
                <div className="text-muted-foreground">
                  {output.content.outputs?.map((agentOutput: any, index: number) => (
                    <div key={index} className="mt-8 bg-card rounded-lg border shadow-sm">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={`agent-${index}`} className="border-none">
                          <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                            {agentOutput.agent}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4">
                            {agentOutput.outputs?.map((outputItem: any, outputIndex: number) => (
                              <div key={outputIndex} className="mb-6 last:mb-0">
                                {outputItem.text && (
                                  <h4 className="text-base font-semibold mb-3 text-foreground">
                                    {outputItem.text}
                                  </h4>
                                )}
                                {outputItem.content && (
                                  <div className="prose prose-sm max-w-none">
                                    <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-4">
                                      {outputItem.content.split('\n').map((paragraph: string, pIndex: number) => (
                                        paragraph.trim() && (
                                          <p 
                                            key={pIndex} 
                                            className={`mb-3 last:mb-0 ${
                                              paragraph.endsWith(':') ? 'font-semibold' : ''
                                            }`}
                                          >
                                            {paragraph}
                                          </p>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};