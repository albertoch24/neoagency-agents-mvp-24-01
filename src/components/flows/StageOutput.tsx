import { Card, CardContent } from "@/components/ui/card";

interface StageOutputProps {
  output: {
    created_at: string;
    content: {
      response: string;
    };
  };
}

export const StageOutput = ({ output }: StageOutputProps) => {
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">Required Output:</p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            {output.content.response}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};