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

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Check if line is a header (starts with # or contains : at the end)
      if (line.startsWith('#') || line.endsWith(':')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-primary mt-6 mb-3">
            {line.replace('#', '').trim()}
          </h4>
        );
      }
      // Return regular paragraph if not empty
      if (line.trim()) {
        return (
          <p key={index} className="mb-4 leading-relaxed">
            {line}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <Card className="w-full bg-background shadow-lg">
      <CardContent className="p-8">
        <ScrollArea className="h-[600px] pr-6">
          <div className="space-y-12">
            {outputs.map((output) => (
              <div key={output.id} className="space-y-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {output.content.stage_name || 'Stage Output'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(output.created_at), "PPpp")}
                  </span>
                </div>
                
                <div className="text-foreground">
                  {output.content.outputs?.map((agentOutput: any, index: number) => (
                    <div key={index} className="mt-8">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem 
                          value={`agent-${index}`} 
                          className="border rounded-lg shadow-sm bg-card/50 backdrop-blur-sm"
                        >
                          <AccordionTrigger className="px-6 py-4 text-xl font-semibold hover:no-underline data-[state=open]:text-primary">
                            {agentOutput.agent}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            {agentOutput.outputs?.map((outputItem: any, outputIndex: number) => (
                              <div key={outputIndex} className="mb-8 last:mb-0">
                                {outputItem.text && (
                                  <h4 className="text-lg font-semibold mb-4 text-primary">
                                    {outputItem.text}
                                  </h4>
                                )}
                                {outputItem.content && (
                                  <div className="prose prose-sm max-w-none">
                                    <div className="rounded-md bg-muted/30 p-6 backdrop-blur-sm">
                                      {formatContent(outputItem.content)}
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