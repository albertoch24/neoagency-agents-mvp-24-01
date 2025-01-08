import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentOutput } from "../AgentOutput";
import { Json } from "@/integrations/supabase/types";

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
  console.log("Rendering OutputDisplay with output:", output);
  
  if (!output?.content?.outputs) {
    console.log("No outputs found in content");
    return null;
  }

  return (
    <Card className="mt-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="output">
          <AccordionTrigger className="px-4">
            View Output Details
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[600px] px-4">
              <div className="space-y-8">
                {output.content.outputs.map((agentOutput, index) => (
                  <AgentOutput
                    key={`${agentOutput.agent}-${index}`}
                    agent={agentOutput.agent}
                    outputs={agentOutput.outputs.map(out => ({
                      content: out.content,
                      type: out.type || 'text'
                    }))}
                    orderIndex={agentOutput.orderIndex || index}
                    requirements={agentOutput.requirements}
                    index={index}
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