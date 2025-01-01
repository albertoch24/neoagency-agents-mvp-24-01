import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StageOutputProps {
  output: {
    created_at?: string;
    content: {
      response?: string;
      outputs?: Array<{
        agent: string;
        outputs: Array<{
          content: string;
        }>;
      }>;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export const StageOutput = ({ output }: StageOutputProps) => {
  const formatOutput = (content: any): string => {
    // Se c'è una risposta diretta, la usiamo
    if (content.response) {
      return content.response;
    }

    // Se ci sono outputs strutturati, li processiamo
    if (content.outputs && Array.isArray(content.outputs)) {
      return content.outputs
        .map((agentOutput: any) => {
          if (Array.isArray(agentOutput.outputs)) {
            return agentOutput.outputs
              .map((output: any) => {
                if (output.content) {
                  // Manteniamo i marker per i punti elenco ma rimuoviamo altri marker
                  return output.content
                    .replace(/####|\*\*/g, '')
                    .trim();
                }
                return '';
              })
              .join('\n\n');
          }
          return '';
        })
        .join('\n\n');
    }

    // Se il contenuto è una stringa, la puliamo e la restituiamo
    if (typeof content === 'string') {
      // Manteniamo i marker per i punti elenco ma rimuoviamo altri marker
      return content.replace(/####|\*\*/g, '').trim();
    }

    // Se è un oggetto, cerchiamo proprietà rilevanti
    if (typeof content === 'object' && content !== null) {
      const relevantKeys = ['summary', 'conclusion', 'result', 'message'];
      for (const key of relevantKeys) {
        if (content[key]) {
          return typeof content[key] === 'string' 
            ? content[key].replace(/####|\*\*/g, '').trim()
            : content[key];
        }
      }
    }

    return '';
  };

  if (!output?.content) {
    return null;
  }

  const formattedOutput = formatOutput(output.content);

  if (!formattedOutput) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="stage-summary">
            <AccordionTrigger className="text-sm font-medium">
              Stage Summary
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted rounded-lg p-4 mt-2">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {formattedOutput}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};