import { MarkdownContent } from "@/components/flows/MarkdownContent";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AgentOutputHeader } from "./AgentOutputHeader";

interface Output {
  content: string;
  type: string;
}

interface AgentOutputProps {
  agent: string;
  outputs: Output[];
  orderIndex: number;
  requirements?: string;
  index: number;
}

export const AgentOutput = ({ agent, outputs, orderIndex, requirements, index }: AgentOutputProps) => {
  console.log("Rendering AgentOutput:", { agent, outputsCount: outputs?.length, orderIndex });
  
  return (
    <div key={index} className="mt-8 space-y-4">
      <AgentOutputHeader 
        agent={agent}
        orderIndex={orderIndex}
        requirements={requirements}
      />

      <Accordion type="single" defaultValue={`output-${index}`} collapsible className="w-full">
        <AccordionItem value={`output-${index}`} className="border-none">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline py-2 px-4 bg-muted/30 rounded-lg">
            <span>Output Details</span>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="prose prose-sm max-w-none mb-8">
              <div className="rounded-lg bg-agent p-6 border border-agent-border space-y-4">
                {outputs?.map((output, outputIndex) => (
                  <div key={outputIndex} className="space-y-2">
                    <MarkdownContent content={output.content} />
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};