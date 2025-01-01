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
    stage_summary?: string;
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
                  // Rimuoviamo i marker tecnici ma preserviamo i bullet points con spaziatura corretta
                  return output.content
                    .replace(/###|####/g, '')
                    .replace(/\*\*/g, '')
                    .replace(/^-\s*/gm, '• ') // Convertiamo i trattini in bullet points con spaziatura uniforme
                    .replace(/•\s+•\s*/g, '• ') // Rimuoviamo bullet points duplicati
                    .replace(/^•\s*([A-Za-z])/gm, '• $1') // Assicuriamo uno spazio dopo il bullet point
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
      return content
        .replace(/###|####/g, '')
        .replace(/\*\*/g, '')
        .replace(/^-\s*/gm, '• ')
        .replace(/•\s+•\s*/g, '• ')
        .replace(/^•\s*([A-Za-z])/gm, '• $1')
        .trim();
    }

    // Se è un oggetto, cerchiamo proprietà rilevanti
    if (typeof content === 'object' && content !== null) {
      const relevantKeys = ['summary', 'conclusion', 'result', 'message'];
      for (const key of relevantKeys) {
        if (content[key]) {
          return typeof content[key] === 'string' 
            ? content[key]
                .replace(/###|####/g, '')
                .replace(/\*\*/g, '')
                .replace(/^-\s*/gm, '• ')
                .replace(/•\s+•\s*/g, '• ')
                .replace(/^•\s*([A-Za-z])/gm, '• $1')
                .trim()
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
  const stageSummary = output.stage_summary;

  if (!formattedOutput && !stageSummary) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <Accordion type="single" collapsible defaultValue="">
          {stageSummary && (
            <AccordionItem value="stage-summary" className="border-b">
              <AccordionTrigger className="text-sm font-medium">
                Stage Summary
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-muted rounded-lg p-4 mt-2">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {stageSummary}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          {formattedOutput && (
            <AccordionItem value="detailed-output">
              <AccordionTrigger className="text-sm font-medium">
                Detailed Output
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-muted rounded-lg p-4 mt-2">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {formattedOutput}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
};