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
import { marked } from "marked";

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

  const formatText = (text: string) => {
    // Prepara il testo per la conversione in HTML
    const preparedText = text
      // Rimuove i marcatori tecnici non necessari
      .replace(/###|####/g, '')
      .replace(/\*\*/g, '*')  // Converte ** in * per il markdown standard
      .replace(/^-\s/gm, '• ') // Converte i trattini in bullet points
      .trim();

    // Configura marked per output sicuro e personalizzato
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Converte i ritorni a capo in <br>
      smartLists: true,
      smartypants: true,
    });

    // Converte il markdown in HTML
    const htmlContent = marked(preparedText);

    // Wrappa il contenuto HTML in un div con stili appropriati
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
            {outputs.map((output) => (
              <div key={output.id} className="space-y-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {output.content.stage_name || 'Analisi'}
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
                            <div className="prose prose-sm max-w-none">
                              <div className="rounded-md bg-muted/30 p-6 backdrop-blur-sm">
                                {typeof agentOutput.outputs === 'string' 
                                  ? formatText(agentOutput.outputs)
                                  : agentOutput.outputs?.map((output: any, outputIndex: number) => (
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
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};