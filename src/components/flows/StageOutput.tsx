import { Card, CardContent } from "@/components/ui/card";

interface StageOutputProps {
  output: {
    created_at?: string;
    content: {
      response?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export const StageOutput = ({ output }: StageOutputProps) => {
  const formatOutput = (content: any) => {
    // Se c'è una risposta diretta, la usiamo
    if (content.response) {
      return content.response;
    }

    // Altrimenti, cerchiamo di estrarre il contenuto rilevante
    if (typeof content === 'object') {
      // Cerca prima negli outputs se esistono
      if (content.outputs && Array.isArray(content.outputs)) {
        return content.outputs
          .map((output: any) => {
            if (output.content) {
              // Rimuove marcatori tecnici e formatta il testo
              return output.content
                .replace(/###|####|\*\*|-\s/g, '')
                .trim();
            }
            return '';
          })
          .join('\n\n');
      }
      
      // Se non ci sono outputs, prova a usare altre proprietà rilevanti
      const relevantKeys = ['summary', 'conclusion', 'result', 'message'];
      for (const key of relevantKeys) {
        if (content[key]) {
          return content[key];
        }
      }
    }

    // Se tutto fallisce, ritorna una stringa vuota
    return '';
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">Riepilogo:</p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {formatOutput(output.content)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};