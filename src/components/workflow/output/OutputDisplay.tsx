import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AgentOutput } from "../AgentOutput";

interface OutputDisplayProps {
  output: {
    content: {
      outputs?: Array<{
        agent: string;
        stepId?: string;
        outputs: Array<{
          content: string;
          type?: string;
        }>;
        orderIndex?: number;
        requirements?: string;
      }>;
      [key: string]: any;
    };
  };
}

export const OutputDisplay = ({ output }: OutputDisplayProps) => {
  console.log("🎨 OutputDisplay received:", {
    hasContent: !!output?.content,
    contentKeys: output?.content ? Object.keys(output.content) : [],
    outputsCount: output?.content?.outputs?.length || 0,
    outputs: output?.content?.outputs?.map(out => ({
      agent: out.agent,
      hasStepId: !!out.stepId,
      outputsCount: out.outputs?.length
    }))
  });

  const outputs = output.content.outputs || [];

  if (!outputs || outputs.length === 0) {
    console.log("⚠️ No outputs available to display");
    return (
      <Card className="mt-4 p-4">
        <p className="text-muted-foreground">No output available</p>
      </Card>
    );
  }

  console.log("✅ Rendering outputs:", {
    count: outputs.length,
    agents: outputs.map(o => o.agent)
  });

  return (
    <Card className="mt-4">
      <Accordion type="single" collapsible defaultValue="">
        <AccordionItem value="output" className="border-none">
          <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:no-underline">
            View Output Details
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[600px] px-4 pb-4">
              <div className="space-y-8">
                {outputs.map((agentOutput, index) => (
                  <AgentOutput
                    key={index}
                    index={index}
                    agent={agentOutput.agent}
                    outputs={agentOutput.outputs}
                    orderIndex={agentOutput.orderIndex || index}
                    requirements={agentOutput.requirements}
                  />
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};