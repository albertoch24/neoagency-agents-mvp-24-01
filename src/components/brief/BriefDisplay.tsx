import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Brief {
  title: string;
  description: string;
  objectives: string;
  target_audience: string;
  budget: string;
  timeline: string;
  current_stage: string;
}

interface BriefDisplayProps {
  brief: Brief;
}

const BriefDisplay = ({ brief }: BriefDisplayProps) => {
  return (
    <Card className="mb-8">
      <Accordion type="single" collapsible>
        <AccordionItem value="brief-details">
          <AccordionTrigger className="px-6 py-4">
            <h2 className="text-xl font-semibold">{brief.title}</h2>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Description</h3>
                <p>{brief.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Objectives</h3>
                <p>{brief.objectives}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Target Audience</h3>
                <p>{brief.target_audience}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Budget</h3>
                <p>{brief.budget}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Timeline</h3>
                <p>{brief.timeline}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground mb-1">Current Stage</h3>
                <p>{brief.current_stage}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default BriefDisplay;