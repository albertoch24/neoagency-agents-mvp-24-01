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
  console.log("🎨 OutputDisplay initialization:", {
    hasContent: !!output?.content,
    contentKeys: output?.content ? Object.keys(output.content) : [],
    outputsCount: output?.content?.outputs?.length || 0,
    timestamp: new Date().toISOString()
  });

  const outputs = output?.content?.outputs || [];

  const validOutputs = outputs.map((out, index) => {
    const processedOutput = {
      ...out,
      agent: out.agent || 'Unknown Agent',
      outputs: Array.isArray(out.outputs) ? out.outputs.filter(o => !!o.content) : [],
      orderIndex: out.orderIndex || 0,
      requirements: out.requirements || ''
    };

    console.log(`Processing output ${index + 1}/${outputs.length}:`, {
      agent: processedOutput.agent,
      outputsCount: processedOutput.outputs.length,
      hasValidContent: processedOutput.outputs.some(o => !!o.content),
      timestamp: new Date().toISOString()
    });

    return processedOutput;
  });

  if (!validOutputs || validOutputs.length === 0) {
    console.log("⚠️ No valid outputs to display", {
      originalOutputs: outputs.length,
      validOutputs: validOutputs.length,
      timestamp: new Date().toISOString()
    });
    return (
      <Card className="mt-4 p-4">
        <p className="text-muted-foreground">No output available</p>
      </Card>
    );
  }

  console.log("✅ Rendering outputs:", {
    count: validOutputs.length,
    agents: validOutputs.map(o => o.agent),
    outputDetails: validOutputs.map(o => ({
      agent: o.agent,
      outputsCount: o.outputs.length,
      hasContent: o.outputs.some(out => !!out.content)
    })),
    timestamp: new Date().toISOString()
  });

  return (
    <Card className="mt-4">
      <Accordion type="single" collapsible defaultValue="output">
        <AccordionItem value="output" className="border-none">
          <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:no-underline">
            View Output Details
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[600px] px-4 pb-4">
              <div className="space-y-8">
                {validOutputs.map((agentOutput, index) => (
                  <AgentOutput
                    key={index}
                    index={index}
                    agent={agentOutput.agent}
                    outputs={agentOutput.outputs}
                    orderIndex={agentOutput.orderIndex}
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