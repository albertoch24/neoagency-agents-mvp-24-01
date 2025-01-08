import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentOutput } from "../types/StageOutput";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarkdownContent } from "@/components/flows/MarkdownContent";

interface AgentOutputCardProps {
  agentOutput: AgentOutput;
  index: number;
}

export function AgentOutputCard({ agentOutput, index }: AgentOutputCardProps) {
  return (
    <div className="mt-8">
      <div className="bg-agent p-6 rounded-lg border border-agent-border shadow-sm mb-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <Badge 
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-2 rounded-full font-bold flex flex-col items-center min-w-[60px]"
              >
                <span>Step</span>
                <span>{agentOutput.orderIndex + 1}</span>
              </Badge>
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-bold text-agent-foreground">
                  {agentOutput.agent}
                </h4>
                {agentOutput.requirements && (
                  <span className="text-sm text-muted-foreground">
                    {agentOutput.requirements}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Accordion type="single" defaultValue={`output-${index}`} collapsible className="w-full">
        <AccordionItem value={`output-${index}`}>
          <AccordionTrigger className="text-sm font-medium">
            View Output Details
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none mb-8">
              <div className="rounded-md bg-muted/30 p-6 backdrop-blur-sm">
                {agentOutput.outputs?.map((output, outputIndex) => (
                  <div key={outputIndex} className="mb-8 last:mb-0">
                    {output.type === 'conversational' && (
                      <MarkdownContent content={output.content} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}