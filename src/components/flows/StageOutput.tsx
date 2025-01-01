import { Card, CardContent } from "@/components/ui/card";

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
                  return output.content
                    .replace(/###|####|\*\*|-\s/g, '')
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
      return content.replace(/###|####|\*\*|-\s/g, '').trim();
    }

    // Se è un oggetto, cerchiamo proprietà rilevanti
    if (typeof content === 'object' && content !== null) {
      const relevantKeys = ['summary', 'conclusion', 'result', 'message'];
      for (const key of relevantKeys) {
        if (content[key]) {
          return typeof content[key] === 'string' 
            ? content[key].replace(/###|####|\*\*|-\s/g, '').trim()
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
        <p className="text-sm font-medium mb-2">Riepilogo:</p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {formattedOutput}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};