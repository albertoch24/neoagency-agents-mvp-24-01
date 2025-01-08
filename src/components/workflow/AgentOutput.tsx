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
    <div key={index} className="mt-8">
      <AgentOutputHeader 
        agent={agent}
        orderIndex={orderIndex}
        requirements={requirements}
      />

      <Accordion type="single" defaultValue={`output-${index}`} collapsible className="w-full">
        <AccordionItem value={`output-${index}`}>
          <AccordionTrigger className="text-lg font-semibold">
            View Output Details
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none mb-8">
              <div className="rounded-md bg-muted/30 p-6 backdrop-blur-sm">
                {outputs?.map((output, outputIndex) => (
                  <div key={outputIndex} className="mb-8 last:mb-0">
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