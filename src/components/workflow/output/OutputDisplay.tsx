import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AgentOutput } from "../AgentOutput";
import { DocumentInfluence } from "./DocumentInfluence";

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
      relevantDocs?: Array<{
        content: string;
        metadata?: {
          title?: string;
          source?: string;
        };
        similarity?: number;
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
    hasRelevantDocs: !!output?.content?.relevantDocs,
    outputs: output?.content?.outputs?.map(out => ({
      agent: out.agent || 'Unknown Agent',
      hasStepId: !!out.stepId,
      outputsCount: out.outputs?.length || 0,
      firstOutput: out.outputs?.[0]?.content
    }))
  });

  const outputs = output?.content?.outputs || [];
  const relevantDocs = output?.content?.relevantDocs;

  // Ensure outputs have required properties and validate structure
  const validOutputs = outputs.map(out => {
    const processedOutput = {
      ...out,
      agent: out.agent || 'Unknown Agent',
      outputs: Array.isArray(out.outputs) ? out.outputs.filter(o => !!o.content) : [],
      orderIndex: out.orderIndex || 0,
      requirements: out.requirements || ''
    };

    console.log(`Processing output for agent ${processedOutput.agent}:`, {
      outputsCount: processedOutput.outputs.length,
      hasValidContent: processedOutput.outputs.some(o => !!o.content)
    });

    return processedOutput;
  });

  if (!validOutputs || validOutputs.length === 0) {
    console.log("⚠️ No valid outputs available to display");
    return (
      <Card className="mt-4 p-4">
        <p className="text-muted-foreground">No output available</p>
      </Card>
    );
  }

  console.log("✅ Rendering outputs:", {
    count: validOutputs.length,
    agents: validOutputs.map(o => o.agent),
    hasRelevantDocs: !!relevantDocs,
    docsCount: relevantDocs?.length || 0,
    outputDetails: validOutputs.map(o => ({
      agent: o.agent,
      outputsCount: o.outputs.length,
      hasContent: o.outputs.some(out => !!out.content)
    }))
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
                {relevantDocs && <DocumentInfluence relevantDocs={relevantDocs} />}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};