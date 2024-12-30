import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkflowOutputProps {
  outputs: any[];
}

export const WorkflowOutput = ({ outputs }: WorkflowOutputProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stage Output</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {outputs.map((output) => (
            <div key={output.id} className="space-y-3">
              <h4 className="text-lg font-semibold text-primary">
                {output.content.agent_name || 'System Output'}
              </h4>
              <div className="text-muted-foreground whitespace-pre-wrap">
                {output.content.response.split('\n').map((paragraph: string, index: number) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};