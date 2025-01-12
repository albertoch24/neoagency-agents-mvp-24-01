import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DocumentInfluenceProps {
  relevantDocs?: Array<{
    content: string;
    metadata?: {
      title?: string;
      source?: string;
    };
    similarity?: number;
  }>;
}

export const DocumentInfluence = ({ relevantDocs }: DocumentInfluenceProps) => {
  if (!relevantDocs || relevantDocs.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Documents Used ({relevantDocs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-4">
            {relevantDocs.map((doc, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {doc.metadata?.title || `Document ${index + 1}`}
                  </span>
                  <Badge variant="secondary">
                    {doc.similarity 
                      ? `${(doc.similarity * 100).toFixed(1)}% relevant`
                      : 'Relevance unknown'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{doc.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};